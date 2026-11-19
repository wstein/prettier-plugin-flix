import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFixture, optionsFor } from "../test/fixture.mjs";
import { readHandoff, writeHandoff } from "../docs/assets/js/playground-link.js";
import { fingerprint, fmt, programProblems } from "../test/lib.mjs";

const site = new URL("../docs/public/", import.meta.url);
const page = await readFile(new URL("playground/index.html", site), "utf8");
const asset = page.match(/\bdata-formatter=(?:"([^"]+)"|([^\s>]+))/);
assert.ok(asset, "Playground page links to its formatter bundle");
const { formatFlix } = await import(new URL(`js/${basename(asset[1] ?? asset[2])}`, site));

test("the published browser bundle matches CLI and fixture output", async () => {
    const path = fileURLToPath(new URL("../test/fixtures/expressions/align-map-comment.md", import.meta.url));
    const fixture = loadFixture(path);
    for (const block of fixture.outputs) {
        const options = optionsFor(fixture, block);
        const output = await formatFlix(fixture.input.code, options);
        assert.equal(output, await fmt(fixture.input.code, options));
        assert.equal(output, block.code);
    }
});

test("the published browser bundle reports syntax error locations", async () => {
    await assert.rejects(() => formatFlix("def", {}), (error) =>
        error instanceof SyntaxError && error.loc?.start.line === 1 && error.loc.start.column > 0,
    );
});

test("the browser formatter points to the backslash before a real newline", async () => {
    const prefix = 'def receipt(): String = "${123} 🚉 ';
    for (const newline of ["\n", "\r\n", "\r"]) {
        const input = prefix + "\\" + newline + 'including shipping"\n';
        await assert.rejects(() => formatFlix(input, {}), (error) => {
            assert.match(error.message, /backslash cannot continue a string/);
            assert.deepEqual(error.loc?.start, { line: 1, column: Array.from(prefix).length + 1 });
            return true;
        });
    }
    const valid = String.raw`def receipt(): String = "cents\nincluding shipping"` + "\n";
    assert.equal(await formatFlix(valid, {}), valid);
});

test("Playground examples start at 80 columns and the formatter defaults to 100", async () => {
    assert.match(page, /data-print-width[^>]*\bvalue=(?:"80"|80)(?:\s|>)/);
    assert.match(page, /data-cursor-position[^>]*>Ln 1, Col 1/);
    assert.match(page, /playground-statusbar[^>]*>\s*<p[^>]*role=(?:"status"|status)>Loading the editor…/);
    const input = 'def sample(): Bool = verifyExample("a moderately long argument", "a second moderately long argument")';
    const defaultOutput = await formatFlix(input, {});
    assert.equal(defaultOutput, await fmt(input, { printWidth: 100 }));
    assert.notEqual(defaultOutput, await formatFlix(input, { printWidth: 80 }));
});

test("embedded examples open with their 60-column preview", async () => {
    const catalog = JSON.parse(await readFile(new URL("../docs/data/fixtures.json", import.meta.url), "utf8"));
    const fixture = catalog.datalog.groups.flatMap((group) => group.fixtures).find((item) => item.path === "datalog/transit.md");
    const { source, output, ...options } = fixture.initial;
    assert.equal(options.printWidth, 60);
    assert.equal(output, await formatFlix(source, options));
    const chapter = await readFile(new URL("datalog/index.html", site), "utf8");
    assert.match(chapter, /data-print-width[^>]*\bvalue=(?:"60"|60)(?:\s|>)/);
});

test("all curated examples match their fixtures in the published browser bundle", async () => {
    const data = await readFile(new URL("../docs/data/playground.json", import.meta.url), "utf8");
    const { fixtures } = JSON.parse(data);
    for (const [path, { input, options }] of Object.entries(fixtures)) {
        const fixture = loadFixture(fileURLToPath(new URL(`../test/fixtures/${path}`, import.meta.url)));
        assert.equal(input, fixture.input.code, path);
        assert.deepEqual(options, fixture.outputs.map((block) => optionsFor(fixture, block)), path);
        const original = fingerprint(input);
        assert.deepEqual(original.errors, [], path);
        for (const [index, block] of fixture.outputs.entries()) {
            const settings = options[index];
            const output = await formatFlix(input, settings);
            assert.equal(output, block.code, path);
            assert.deepEqual(programProblems(original, fingerprint(output)), [], path);
            assert.equal(await formatFlix(output, settings), output, path);
        }
    }
});

test("the Playground handoff preserves Unicode source and formatting options in a URL fragment", () => {
    const draft = { source: 'pub def board(): String = "🚉 Köln & Zürich"\n', printWidth: 47, tabWidth: 2, useTabs: true };
    const url = new URL(writeHandoff("https://example.test/flix/playground/?fixture=strings%2Fitinerary.md", draft));
    assert.equal(url.searchParams.get("fixture"), "strings/itinerary.md");
    assert.deepEqual(readHandoff(url.hash), draft);
    assert.equal(readHandoff("#code=%21"), undefined);
});
