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

/** Write a fixture tree with exact byte sizes for accounting tests. */
async function writeSizedBundle(dir, { entry = 100, chunk = 200, grammar079, grammar080 }) {
    const formatterAsset = "format-flix-AAAA.js";
    await writeFile(join(dir, formatterAsset), Buffer.alloc(entry));
    await writeFile(join(dir, "chunk-BBBB.js"), Buffer.alloc(chunk));
    await writeFile(join(dir, "grammar-079-CCCC.js"), Buffer.alloc(grammar079));
    await writeFile(join(dir, "grammar-080-DDDD.js"), Buffer.alloc(grammar080));
    return formatterAsset;
}

test("budget accounting totals the formatter entry, every chunk-*, and each grammar", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flix-playground-bytes-"));
    try {
        const entry = 1_000;
        const chunk = 2_000;
        const grammar = MIN_GRAMMAR_CHUNK_BYTES;
        const formatterAsset = await writeSizedBundle(dir, {
            entry,
            chunk,
            grammar079: grammar,
            grammar080: grammar + 7,
        });
        const measured = await measureFormatterBundle(dir, formatterAsset);
        assert.deepEqual(measured.sharedNames, [formatterAsset, "chunk-BBBB.js"]);
        assert.equal(measured.shared, entry + chunk);
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
            chunk,
            grammar079: grammar,
            grammar080: grammar,
        });
        const atLimit = await measureFormatterBundle(dir, formatterAsset);
        assert.equal(atLimit.shared + atLimit.grammars["079"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES);
        assertLazyGrammarBudget(atLimit);

        await writeFile(join(dir, "chunk-BBBB.js"), Buffer.alloc(chunk + 1));
        const over = await measureFormatterBundle(dir, formatterAsset);
        assert.equal(over.shared + over.grammars["079"].size, MAX_FORMATTER_WITH_GRAMMAR_BYTES + 1);
        assert.throws(() => assertLazyGrammarBudget(over), /maximum 1048576 bytes/);
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
