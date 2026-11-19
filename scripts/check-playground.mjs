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

test("all curated examples format safely in the published browser bundle", async () => {
    const data = await readFile(new URL("../docs/data/playground.json", import.meta.url), "utf8");
    const { fixtures } = JSON.parse(data);
    for (const [path, { input, options }] of Object.entries(fixtures)) {
        const original = fingerprint(input);
        assert.deepEqual(original.errors, [], path);
        for (const settings of options) {
            const output = await formatFlix(input, settings);
            assert.deepEqual(programProblems(original, fingerprint(output)), [], path);
            assert.equal(await formatFlix(output, settings), output, path);
        }
    }
});

test("the guide handoff preserves Unicode source and formatting options in a URL fragment", () => {
    const draft = { source: 'pub def board(): String = "🚉 Köln & Zürich"\n', printWidth: 47, tabWidth: 2, useTabs: true };
    const url = new URL(writeHandoff("https://example.test/flix/playground/?fixture=examples%2Fitinerary.flix", draft));
    assert.equal(url.searchParams.get("fixture"), "examples/itinerary.flix");
    assert.deepEqual(readHandoff(url.hash), draft);
    assert.equal(readHandoff("#code=%21"), undefined);
});
