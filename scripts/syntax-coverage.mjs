import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CharStream, CommonTokenStream } from "antlr4ng";
import { FlixLexer } from "../dist/generated/FlixLexer.js";
import { FlixParser } from "../dist/generated/FlixParser.js";
import { parseFlix } from "../dist/parse.js";
import { findFixtures, loadFixture } from "../test/fixture.mjs";

const testDir = fileURLToPath(new URL("../test", import.meta.url));
const fixtures = findFixtures(join(testDir, "fixtures")).map((path) => loadFixture(path));
const fixtureInputs = fixtures.filter(({ meta }) => meta.status !== "error").map(({ input }) => input.code);
const parserSource = readFileSync(new URL("../dist/generated/FlixParser.js", import.meta.url), "utf8");
const alternatives = [...parserSource.matchAll(/^export class (\w+Context) extends \w+Context \{/gm)]
    .map((match) => match[1]);
const tokenNames = FlixLexer.symbolicNames.filter(Boolean);

function* flixFiles(path) {
    if (!statSync(path).isDirectory()) {
        if (path.endsWith(".flix")) yield path;
        return;
    }
    for (const entry of readdirSync(path, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== ".git" && entry.name !== "node_modules") {
            yield* flixFiles(join(path, entry.name));
        } else if (entry.isFile() && entry.name.endsWith(".flix")) {
            yield join(path, entry.name);
        }
    }
}

function measure(sources) {
    const tokens = new Set();
    const rules = new Set();
    const contexts = new Set();
    let parsed = 0;
    let skipped = 0;
    for (const source of sources) {
        let root;
        try {
            root = parseFlix(source);
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;
            skipped++;
            continue;
        }
        parsed++;
        const stream = new CommonTokenStream(new FlixLexer(CharStream.fromString(source)));
        stream.fill();
        for (const token of stream.getTokens()) tokens.add(FlixLexer.symbolicNames[token.type]);

        const nodes = [root.tree];
        while (nodes.length) {
            const node = nodes.pop();
            rules.add(FlixParser.ruleNames[node.ruleIndex]);
            contexts.add(node.constructor.name);
            for (const child of node.children ?? []) nodes.push(child);
        }
    }
    return { tokens, rules, contexts, parsed, skipped };
}

const localFiles = readdirSync(testDir).filter((name) => name.endsWith(".flix"))
    .map((name) => join(testDir, name));

function report(label, { tokens, rules, contexts, parsed, skipped }) {
    console.log(`\n${label} (${parsed} parsed, ${skipped} syntax errors skipped)`);
    for (const [name, universe, observed] of [
        ["Named lexer tokens", tokenNames, tokens],
        ["Parser rules", FlixParser.ruleNames, rules],
        ["Labeled alternatives", alternatives, contexts],
    ]) {
        const missing = universe.filter((item) => !observed.has(item));
        console.log(`  ${name}: ${universe.length - missing.length}/${universe.length}`);
        if (missing.length) console.log(`    Unobserved: ${missing.join(", ")}`);
    }
}

report("Markdown fixture inputs", measure(fixtureInputs));
report("Local fixtures and .flix tests", measure([...fixtureInputs, ...localFiles.map((path) => readFileSync(path, "utf8"))]));
const externalFiles = [...new Set(process.argv.slice(2).flatMap((path) => [...flixFiles(path)]))];
if (externalFiles.length) {
    report("External corpus", measure(externalFiles.map((path) => readFileSync(path, "utf8"))));
}
