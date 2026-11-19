import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHighlighter } from "shiki";
import { findFixtures, loadFixture, optionsFor, relativeTo } from "../test/fixture.mjs";

const root = fileURLToPath(new URL("../test/fixtures", import.meta.url));
const destination = new URL("../docs/data/", import.meta.url);
const chapters = {};
const showcase = [];
const grammar = JSON.parse(await readFile(new URL("../docs/syntax/flix.tmLanguage.json", import.meta.url), "utf8"));
const themes = { light: "github-light", dark: "github-dark" };
const highlighter = await createHighlighter({
    langs: [{ ...grammar, name: "flix" }],
    themes: Object.values(themes),
});
const highlight = (code) => highlighter.codeToHtml(code, {
    lang: "flix",
    themes,
    defaultColor: false,
});


function describeOptions(fixture, block) {
    const defaults = { printWidth: 80, tabWidth: 4, useTabs: false };
    const base = { ...defaults, ...fixture.meta.options };
    const configured = optionsFor(fixture, block);
    const effective = { ...defaults, ...configured };
    const notes = [];
    if (effective.printWidth !== base.printWidth) {
        notes.push(`Changes the preferred line width from ${base.printWidth} to ${effective.printWidth} columns.`);
    }
    if (effective.tabWidth !== base.tabWidth) {
        notes.push(`Changes each indentation level from ${base.tabWidth} to ${effective.tabWidth} columns.`);
    }
    if (effective.useTabs !== base.useTabs) {
        notes.push(effective.useTabs ? "Uses tabs for indentation." : "Uses spaces for indentation.");
    }
    return {
        options: Object.entries({ printWidth: defaults.printWidth, ...configured })
            .map(([key, value]) => `${key}: ${value}`).join(", "),
        note: notes.join(" "),
    };
}

for (const path of findFixtures(root)) {
    const relative = relativeTo(root, path);
    const [chapter] = relative.split("/");
    const fixture = loadFixture(path, relative);
    const { meta, input, outputs, flixFormat } = fixture;
    const referenceHeading = fixture.lines.findIndex((line) => /^## Flix Format\s*$/.test(line));
    const reference = flixFormat && {
        version: meta.flixFormat,
        invalid: meta.flixFormatInvalid === true,
        language: flixFormat.language,
        code: flixFormat.language === "text" ? flixFormat.code : undefined,
        html: flixFormat.language === "flix" ? highlight(flixFormat.code) : undefined,
        note: fixture.lines.slice(referenceHeading + 1, flixFormat.start - 1).join("\n").trim(),
    };
    const entry = chapters[chapter] ??= { count: 0, groups: [] };
    const title = meta.group?.trim() ?? "";
    let group = entry.groups.find((item) => item.title === title);
    if (!group) {
        group = { title, fixtures: [] };
        entry.groups.push(group);
    }
    entry.count++;
    const example = {
        id: basename(relative, ".md"),
        path: relative,
        chapter,
        upstreamUrl: typeof meta.source === "string" && meta.source.startsWith("https://") ? meta.source : undefined,
        title: meta.title,
        description: meta.description,
        status: meta.status,
        inputHtml: highlight(input.code),
        outputs: outputs.map((block) => ({
            html: highlight(block.code),
            ...describeOptions(fixture, block),
        })),
        reference,
    };
    group.fixtures.push(example);
    if (meta.showcase) showcase.push({ order: meta.showcase, example });
}

highlighter.dispose();
showcase.sort((a, b) => a.order - b.order);
chapters.examples = { count: showcase.length, groups: [{ title: "", fixtures: showcase.map(({ example }) => example) }] };
await mkdir(destination, { recursive: true });
await writeFile(new URL("fixtures.json", destination), JSON.stringify(chapters, null, 2) + "\n");
