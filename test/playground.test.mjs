import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { formatFlix } from "../docs/assets/js/format-flix.js";
import { loadFixture, optionsFor } from "./fixture.mjs";
import { fmt } from "./lib.mjs";

test("playground matches CLI formatting for the default fixture and its variants", async () => {
    const path = fileURLToPath(new URL("fixtures/expressions/align-map-comment.md", import.meta.url));
    const fixture = loadFixture(path);
    for (const block of fixture.outputs) {
        const options = optionsFor(fixture, block);
        const output = await formatFlix(fixture.input.code, options);
        assert.equal(output, await fmt(fixture.input.code, options));
        assert.equal(output, block.code);
    }
});

test("playground reports the source location of syntax errors", async () => {
    await assert.rejects(() => formatFlix("def", {}), (error) =>
        error instanceof SyntaxError && error.loc?.start.line === 1 && error.loc.start.column > 0,
    );
});
