import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/format-checked.mjs", import.meta.url));
const run = (...paths) => spawnSync(process.execPath, [script, ...paths], { stdio: "inherit" });

test("checked formatting writes changed files and leaves unchanged files untouched", (t) => {
    const dir = mkdtempSync(join(tmpdir(), "flix-format-test-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const changed = join(dir, "changed.flix");
    const unchanged = join(dir, "unchanged.flix");
    writeFileSync(changed, "def a():Int32=1\n");
    writeFileSync(unchanged, "def b(): Int32 = 2\n");
    utimesSync(unchanged, 1, 1);

    const result = run(changed, unchanged);
    assert.equal(result.status, 0);
    assert.equal(readFileSync(changed, "utf8"), "def a(): Int32 = 1\n");
    assert.equal(statSync(unchanged).mtimeMs, 1000);
});

test("checked formatting refuses a field-access mutation without writing any file", (t) => {
    const dir = mkdtempSync(join(tmpdir(), "flix-format-test-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const first = join(dir, "first.flix");
    const field = join(dir, "field.flix");
    const source = "def f(s: S[r]): Int32 = s->// keep\nfield\n";
    writeFileSync(first, "def a():Int32=1\n");
    writeFileSync(field, source);

    // Inject the old printer bug at the plugin boundary in this child process only.
    const pluginUrl = new URL("../dist/index.js", import.meta.url);
    const preload = `
        import plugin from ${JSON.stringify(pluginUrl.href)};
        const printer = plugin.printers["flix-ast"];
        const originalPrint = printer.print;
        printer.print = function (path, options) {
            const text = path.node.text;
            if (text.includes("s->// keep")) return text.replace("s->// keep", "s-> // keep");
            return originalPrint.call(this, path, options);
        };
    `;
    const preloadPath = join(dir, "mutate.mjs");
    writeFileSync(preloadPath, preload);
    const logPath = join(dir, "stderr.txt");
    const log = openSync(logPath, "w");
    try {
        const result = spawnSync(process.execPath, ["--import", preloadPath, script, first, field], {
            stdio: ["ignore", "inherit", log],
        });
        assert.equal(result.status, 1);
    } finally {
        closeSync(log);
    }
    assert.match(readFileSync(logPath, "utf8"), /refused to write: .*arrow token classes differ/);
    assert.equal(readFileSync(first, "utf8"), "def a():Int32=1\n");
    assert.equal(readFileSync(field, "utf8"), source);
});
