import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";

const exec = promisify(execFile);
const bookRepo = "https://github.com/flix/book";
const websiteRepo = "https://github.com/flix/flix.dev";
const fence = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const slugify = (value) => value.normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "") || "example";
const sourcePath = (root, file) => relative(root, file).split(sep).join("/");
const read = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

function filesUnder(root, extension) {
    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
        .map((entry) => join(entry.parentPath, entry.name)).sort();
}

function bookCategories(summary) {
    const categories = new Map();
    let category = "general";
    for (const line of summary.split("\n")) {
        const item = /^([ \t]*)(?:[-*+]\s+)?\[([^\]]+)\]\(<?(?:\.\/)?([^)>]+\.md)>?\)/.exec(line);
        if (!item) continue;
        if (item[1].length === 0) category = slugify(item[2]);
        categories.set(item[3], category);
    }
    return categories;
}

export function markdownBlocks(text, fallbackHeading) {
    const lines = text.split("\n");
    const blocks = [];
    let heading = fallbackHeading;
    for (let i = 0; i < lines.length; i++) {
        const start = fence.exec(lines[i]);
        if (!start) {
            const section = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(lines[i]);
            if (section) heading = section[1];
            continue;
        }
        const [, indent, delimiter, info] = start;
        if (delimiter[0] === "`" && info.includes("`")) continue;
        const language = info.trim().split(/[\s,]+/)[0].toLowerCase();
        const firstLine = i + 1;
        const code = [];
        while (++i < lines.length) {
            const end = fence.exec(lines[i]);
            if (end && end[2][0] === delimiter[0] && end[2].length >= delimiter.length && !end[3].trim()) break;
            code.push(lines[i].replace(new RegExp(`^ {0,${indent.length}}`), ""));
        }
        if (language === "flix" || language === "java") {
            if (i === lines.length) throw new Error(`Unclosed ${language} fence at line ${firstLine}`);
            blocks.push({ code: code.join("\n"), heading, language, line: firstLine + 1 });
        }
    }
    return blocks;
}

function templateConstants(files, root) {
    const constants = new Map();
    for (const [file, text, offset] of files) {
        const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        for (const statement of source.statements.filter(ts.isVariableStatement)) {
            for (const declaration of statement.declarationList.declarations) {
                const value = declaration.initializer;
                if (!ts.isIdentifier(declaration.name) || !value) continue;
                if (ts.isNoSubstitutionTemplateLiteral(value) || ts.isTemplateExpression(value)) {
                    const name = declaration.name.text;
                    constants.set(name, {
                        code: ts.isNoSubstitutionTemplateLiteral(value) ? value.text : undefined,
                        file: sourcePath(root, file),
                        line: source.getLineAndCharacterOfPosition(value.getStart(source)).line + offset + 1,
                    });
                }
            }
        }
    }
    return constants;
}

function websiteExamples(root) {
    // Each rendered example comes from the code prop of a Flix component. PlainSnippet
    // also renders manifests and terminal output, which are outside this inventory.
    const library = join(root, "src/lib/indexExamples.js");
    const shared = templateConstants([[library, read(library), 0]], root);
    const examples = [];
    const seen = new Set();
    for (const page of filesUnder(join(root, "src/pages"), ".astro")) {
        const text = read(page);
        const frontmatter = /^---\n([\s\S]*?)^---[ \t]*$/m.exec(text);
        const locals = frontmatter ? templateConstants([[page, frontmatter[1], 1]], root) : new Map();
        const markup = frontmatter ? text.slice(frontmatter[0].length) : text;
        for (const component of markup.matchAll(/<(Feature|CodeSnippet)\b[^>]*>/gs)) {
            if (component[1] === "Feature" && !/\bcode\s*=/.test(component[0])) continue;
            const ref = /\bcode\s*=\s*\{\s*([\w$]+)\s*\}/.exec(component[0]);
            if (!ref) throw new Error(`Unsupported Flix code prop in ${sourcePath(root, page)}: ${component[0]}`);
            const name = ref[1];
            const example = locals.get(name) ?? shared.get(name);
            if (example?.code === undefined) throw new Error(`Expected a static JS template for ${name} in ${sourcePath(root, page)}`);
            const id = `${example.file}:${example.line}`;
            if (seen.has(id)) continue;
            seen.add(id);
            examples.push({
                ...example, language: "flix", heading: name, source: "website",
                category: page.endsWith(`${sep}index.astro`) ? "front-page" : slugify(basename(page, ".astro")),
                topic: slugify(name.replace(/Example$/, "")),
            });
        }
    }
    if (examples.length === 0) throw new Error("No rendered Flix examples found in the website checkout");
    return examples;
}

export async function extractExamples(book, website) {
    const bookSrc = join(book, "src");
    const categories = bookCategories(read(join(bookSrc, "SUMMARY.md")));
    const blocks = filesUnder(bookSrc, ".md").filter((file) => basename(file) !== "SUMMARY.md").flatMap((file) => {
        const topic = slugify(basename(file, ".md"));
        return markdownBlocks(read(file), topic).map((block) => ({
            ...block, source: "book", category: categories.get(sourcePath(bookSrc, file)) ?? "general",
            topic, file: sourcePath(book, file),
        }));
    });
    if (!blocks.some((block) => block.language === "flix")) throw new Error("No Flix code fences found in the book checkout");
    const revision = async (root, repo) => {
        const { stdout } = await exec("git", ["-C", root, "rev-parse", "HEAD"]);
        return { repo, commit: stdout.trim() };
    };
    const [bookRevision, websiteRevision] = await Promise.all([revision(book, bookRepo), revision(website, websiteRepo)]);
    const revisions = { book: bookRevision, website: websiteRevision };
    const names = new Set();
    const examples = [...blocks, ...websiteExamples(website)].map((block) => {
        const { source, category, topic, code, file, line } = block;
        const firstDoc = /^\s*(?:\/\/[^\n]*\n\s*)*?\/\/\/\s*(\S[^\n]*)/.exec(code)?.[1];
        const base = slugify(firstDoc ?? block.heading);
        const prefix = `${source}.${category}.${topic}.`;
        let slug = base;
        for (let i = 2; names.has(prefix + slug); i++) slug = `${base}-${String(i).padStart(2, "0")}`;
        const case_name = prefix + slug;
        names.add(case_name);
        const { repo, commit } = revisions[source];
        const url = `${repo}/blob/${commit}/${file.split("/").map(encodeURIComponent).join("/")}#L${line}`;
        return { ...block, slug, case_name, url };
    });
    return { schema: "source.category.topic.slug (ASCII kebab-case)", revisions, count: examples.length, examples };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const [book, website, output = "flix_examples.json", ...rest] = process.argv.slice(2);
    if (!book || !website || rest.length) {
        console.error("Usage: node scripts/extract-flix-examples.mjs <book> <flix.dev> [output.json]");
        process.exitCode = 2;
    } else {
        const result = await extractExamples(resolve(book), resolve(website));
        writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
        console.log(`Extracted ${result.count} examples into ${output}`);
    }
}
