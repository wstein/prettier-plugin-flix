// Format every parseable fixture input twice across a fixed width set and
// assert equality. Catches width-dependent idempotence bugs that pinned
// Output blocks miss (for example signature breaks at 48–55 or caret markers
// at 55–71).
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fmt } from "./lib.mjs";
import { findFixtures, loadFixture, relativeTo } from "./fixture.mjs";

/** Widths exercised for cross-fixture idempotence. Keep in sync with docs/development.md. */
export const IDEMPOTENCE_PRINT_WIDTHS = [40, 50, 60, 80, 100];

const root = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test("fixture inputs stay idempotent across print widths", async (t) => {
    for (const path of findFixtures(root)) {
        const name = relativeTo(root, path);
        const fixture = loadFixture(path, name);
        if (fixture.meta.status === "error") continue;

        await t.test(name, async () => {
            for (const printWidth of IDEMPOTENCE_PRINT_WIDTHS) {
                const once = await fmt(fixture.input.code, { printWidth });
                const twice = await fmt(once, { printWidth });
                assert.equal(
                    twice,
                    once,
                    `${name} at printWidth ${printWidth}: second format must be a no-op`,
                );
            }
        });
    }
});
