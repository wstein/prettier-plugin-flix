/**
 * Size gates for the Playground formatter build.
 *
 * The browser entry must keep Flix grammars in on-demand chunks. Dropping the
 * esbuild alias in `build-docs-site.mjs` folds both grammars into the eager
 * `chunk-*` payload and leaves ~100-byte `grammar-*` stubs; the Chromium
 * "loads only the selected grammar" check still passes because it only sees
 * those stubs. A minimum grammar-chunk size catches that regression.
 */
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

/** Uncompressed shared formatter plus one selected grammar. */
export const MAX_FORMATTER_WITH_GRAMMAR_BYTES = 1024 * 1024;

/**
 * Real grammar chunks are hundreds of KiB. Eager dual-grammar builds leave
 * stubs under 1 KiB.
 */
export const MIN_GRAMMAR_CHUNK_BYTES = 100 * 1024;

/** Measure the published or esbuild `outdir` formatter assets. */
export async function measureFormatterBundle(dir, formatterAsset) {
    const files = await readdir(dir);
    if (!files.includes(formatterAsset)) {
        throw new Error(`missing formatter asset ${formatterAsset}`);
    }
    const sizeOf = async (names) => {
        if (names.length === 0) return 0;
        const sizes = await Promise.all(names.map(async (name) => (await stat(join(dir, name))).size));
        return sizes.reduce((sum, size) => sum + size, 0);
    };
    const chunkNames = files.filter((name) => /^chunk-[A-Z0-9]+\.js$/.test(name)).sort();
    const sharedNames = [formatterAsset, ...chunkNames];
    const shared = await sizeOf(sharedNames);
    const grammars = {};
    for (const pin of ["079", "080"]) {
        const names = files.filter((name) => name.startsWith(`grammar-${pin}-`)).sort();
        grammars[pin] = {
            names,
            size: await sizeOf(names),
        };
    }
    return { files, sharedNames, shared, grammars };
}

/** Fail when both grammars are eager or a selected grammar exceeds the budget. */
export function assertLazyGrammarBudget({ shared, grammars }) {
    for (const pin of ["079", "080"]) {
        const grammar = grammars[pin];
        assert.equal(
            grammar.names.length,
            1,
            `Expected one published chunk for grammar ${pin}, found ${grammar.names.length}`,
        );
        assert.ok(
            grammar.size >= MIN_GRAMMAR_CHUNK_BYTES,
            `${grammar.names[0]} is ${grammar.size} bytes; expected at least ${MIN_GRAMMAR_CHUNK_BYTES} so both Flix grammars stay out of the Playground startup payload`,
        );
        const withGrammar = shared + grammar.size;
        assert.ok(
            withGrammar <= MAX_FORMATTER_WITH_GRAMMAR_BYTES,
            `Formatter with ${grammar.names[0]} is ${withGrammar} bytes (maximum ${MAX_FORMATTER_WITH_GRAMMAR_BYTES} bytes)`,
        );
    }
}
