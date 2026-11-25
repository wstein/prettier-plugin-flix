import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import {
    assertLazyGrammarBudget,
    measureFormatterBundle,
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
