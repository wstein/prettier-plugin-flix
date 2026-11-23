import assert from "node:assert/strict";
import test from "node:test";
import { createGrammarCache } from "../docs/assets/js/browser-grammar.js";

test("a failed grammar chunk load can be retried in the same realm", async () => {
    let attempts = 0;
    const cache = createGrammarCache({
        "flix-0.80.0": async () => {
            attempts++;
            if (attempts === 1) throw new Error("chunk 404");
            return { id: "flix-0.80.0" };
        },
    });

    await assert.rejects(() => cache.load("flix-0.80.0"), /chunk 404/);
    assert.throws(() => cache.get("flix-0.80.0"), /has not loaded/);

    await cache.load("flix-0.80.0");
    assert.deepEqual(cache.get("flix-0.80.0"), { id: "flix-0.80.0" });
    assert.equal(attempts, 2);

    await cache.load("flix-0.80.0");
    assert.equal(attempts, 2);
});
