import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/check-corpus.mjs", import.meta.url));

for (const [name, source, diagnostic] of [
    ["empty", undefined, /No \.flix files found/],
    ["entirely unparseable", "def broken() =\n", /No Flix source could be checked/],
]) {
    test(`an ${name} corpus fails instead of reporting a successful check`, (t) => {
        const dir = mkdtempSync(join(tmpdir(), "flix-corpus-"));
        t.after(() => rmSync(dir, { recursive: true, force: true }));
        if (source) writeFileSync(join(dir, "broken.flix"), source);
        const logPath = join(dir, "stderr.txt");
        const log = openSync(logPath, "w");
        try {
            const result = spawnSync(process.execPath, [script, dir], { stdio: ["ignore", "ignore", log] });
            assert.ifError(result.error);
            assert.equal(result.status, 1);
        } finally {
            closeSync(log);
        }
        assert.match(readFileSync(logPath, "utf8"), diagnostic);
    });
}
