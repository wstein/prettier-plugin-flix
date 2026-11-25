import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import {
    assertLazyGrammarBudget,
    measureFormatterBundle,
    MAX_FORMATTER_WITH_GRAMMAR_BYTES,
    MIN_GRAMMAR_CHUNK_BYTES,
} from "../scripts/playground-bundle-budget.mjs";

const docs = fileURLToPath(new URL("../docs/", import.meta.url));
const dist = fileURLToPath(new URL("../dist", import.meta.url));

const browserGrammarAlias = {
    name: "browser-grammar",
    setup(buildApi) {
        buildApi.onResolve({ filter: /^\.\/grammar\.js$/ }, ({ resolveDir }) =>
            resolveDir === dist ? { path: join(docs, "assets/js/browser-grammar.js") } : undefined);
    },
};

async function buildFormatter(outdir, plugins) {
    await build({
        entryPoints: [join(docs, "assets/js/format-flix.js")],
        outdir,
        bundle: true,
        splitting: true,
        format: "esm",
        target: "es2022",
        minify: true,
        keepNames: true,
        entryNames: "[name]-[hash]",
        chunkNames: "[name]-[hash]",
        plugins,
    });
    const files = await readdir(outdir);
    const formatterAsset = files.find((name) => name.startsWith("format-flix-"));
    assert.ok(formatterAsset, "expected a format-flix entry chunk");
    return measureFormatterBundle(outdir, formatterAsset);
}

/**
 * Write a fixture tree with exact byte sizes for accounting tests.
 * `chunks` is a list of `[name, size]` pairs; names must match `chunk-[A-Z0-9]+.js`.
 */
async function writeSizedBundle(dir, { entry = 100, chunks = [["chunk-BBBB.js", 200]], grammar079, grammar080 }) {
    const formatterAsset = "format-flix-AAAA.js";
    await writeFile(join(dir, formatterAsset), Buffer.alloc(entry));
    for (const [name, size] of chunks) {
        await writeFile(join(dir, name), Buffer.alloc(size));
    }
    await writeFile(join(dir, "grammar-079-CCCC.js"), Buffer.alloc(grammar079));
    await writeFile(join(dir, "grammar-080-DDDD.js"), Buffer.alloc(grammar080));
    return formatterAsset;
}

test("budget accounting totals the formatter entry, every chunk-*, and each grammar", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flix-playground-bytes-"));
    try {
        const entry = 1_000;
        const chunkA = 2_000;
        const chunkB = 3_000;
        const grammar = MIN_GRAMMAR_CHUNK_BYTES;
        const formatterAsset = await writeSizedBundle(dir, {
            entry,
            chunks: [
                ["chunk-AAAA.js", chunkA],
                ["chunk-BBBB.js", chunkB],
            ],
            grammar079: grammar,
            grammar080: grammar + 7,
        });
        const measured = await measureFormatterBundle(dir, formatterAsset);
        assert.deepEqual(measured.sharedNames, [formatterAsset, "chunk-AAAA.js", "chunk-BBBB.js"]);
        assert.equal(measured.shared, entry + chunkA + chunkB);
        assert.equal(measured.grammars["079"].size, grammar);
        assert.equal(measured.grammars["080"].size, grammar + 7);
        assert.deepEqual(measured.grammars["079"].names, ["grammar-079-CCCC.js"]);
        assert.deepEqual(measured.grammars["080"].names, ["grammar-080-DDDD.js"]);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});

test("the shared-plus-grammar ceiling accepts exactly 1 MiB and rejects one more byte", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flix-playground-ceiling-"));
    try {
        const grammar = MIN_GRAMMAR_CHUNK_BYTES;
        const shared = MAX_FORMATTER_WITH_GRAMMAR_BYTES - grammar;
        const entry = Math.floor(shared / 2);
        const chunk = shared - entry;
        assert.equal(entry + chunk + grammar, MAX_FORMATTER_WITH_GRAMMAR_BYTES);

        const formatterAsset = await writeSizedBundle(dir, {
            entry,
            chunks: [["chunk-BBBB.js", chunk]],
            grammar079: grammar,
            grammar080: grammar,
        });
        const atLimit = await measureFormatterBundle(dir, formatterAsset);
        assert.equal(atLimit.shared + atLimit.grammars["079"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES);
        assert.equal(atLimit.shared + atLimit.grammars["080"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES);
        assertLazyGrammarBudget(atLimit);

        // Each pin must fail the ceiling on its own. A mutant that skips only one
        // pin's check cannot hide behind the other pin throwing first.
        await writeFile(join(dir, "grammar-080-DDDD.js"), Buffer.alloc(grammar + 1));
        const over080 = await measureFormatterBundle(dir, formatterAsset);
        assert.equal(over080.shared + over080.grammars["079"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES);
        assert.equal(over080.shared + over080.grammars["080"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES + 1);
        assert.throws(() => assertLazyGrammarBudget(over080), /grammar-080-DDDD\.js.*maximum 1048576 bytes/);

        await writeFile(join(dir, "grammar-079-CCCC.js"), Buffer.alloc(grammar + 1));
        await writeFile(join(dir, "grammar-080-DDDD.js"), Buffer.alloc(grammar));
        const over079 = await measureFormatterBundle(dir, formatterAsset);
        assert.equal(over079.shared + over079.grammars["079"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES + 1);
        assert.equal(over079.shared + over079.grammars["080"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES);
        assert.throws(() => assertLazyGrammarBudget(over079), /grammar-079-CCCC\.js.*maximum 1048576 bytes/);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});

test("the Playground formatter build keeps each Flix grammar in a large on-demand chunk", async () => {
    const outdir = await mkdtemp(join(tmpdir(), "flix-playground-lazy-"));
    try {
        const measured = await buildFormatter(outdir, [browserGrammarAlias]);
        assertLazyGrammarBudget(measured);
        assert.ok(measured.shared < measured.grammars["079"].size + measured.grammars["080"].size);
    } finally {
        await rm(outdir, { recursive: true, force: true });
    }
});

test("dropping the browser-grammar alias fails the startup-payload budget", async () => {
    const outdir = await mkdtemp(join(tmpdir(), "flix-playground-eager-"));
    try {
        const measured = await buildFormatter(outdir, []);
        assert.ok(
            measured.grammars["079"].size < MIN_GRAMMAR_CHUNK_BYTES,
            "expected tiny grammar stubs when both grammars are eager",
        );
        assert.throws(
            () => assertLazyGrammarBudget(measured),
            /startup payload/,
        );
    } finally {
        await rm(outdir, { recursive: true, force: true });
    }
});
