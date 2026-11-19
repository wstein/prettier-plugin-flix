#!/usr/bin/env node
// Extracts the Flix snippets embedded in the Scala tests of a flix/flix checkout, so they can be
// used as extra formatter inputs (scripts/check-corpus.mjs needs no expected output).
//
//   node scripts/harvest-scala.mjs <flix-checkout> <out-dir>
//
// Takes every triple-quoted string in main/test/**/*.scala, strips the `|` margin of
// `.stripMargin` strings and skips Scala interpolations (`s"""..."""` with `$`). Writes one
// <TestFile>-<n>.flix per snippet plus manifest.json recording the Scala file and line each came
// from, so a failing snippet can be traced back. Many snippets are deliberately invalid (compiler
// error tests); the corpus check skips those because they do not parse.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const [checkout, outDir] = process.argv.slice(2);
if (!checkout || !outDir) {
    console.error("usage: harvest-scala.mjs <flix-checkout> <out-dir>");
    process.exit(2);
}

const scalaFiles = [];
const walk = (dir) => {
    for (const e of readdirSync(dir).sort()) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (e.endsWith(".scala")) scalaFiles.push(full);
    }
};
walk(join(checkout, "main", "test"));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const manifest = [];
let skippedInterpolated = 0;
for (const file of scalaFiles) {
    const text = readFileSync(file, "utf8");
    const re = /(\bs?)"""([\s\S]*?)"""(\s*\.stripMargin)?/g;
    let m;
    let n = 0;
    while ((m = re.exec(text)) !== null) {
        const [, prefix, body, margin] = m;
        if (prefix === "s" && body.includes("$")) { skippedInterpolated++; continue; }
        const code = (margin ? body.split("\n").map((l) => l.replace(/^\s*\|/, "")).join("\n") : body).trim();
        if (code === "") continue;
        n++;
        const name = `${basename(file, ".scala")}-${String(n).padStart(3, "0")}.flix`;
        writeFileSync(join(outDir, name), code + "\n");
        manifest.push({ file: name, scala: relative(checkout, file), line: text.slice(0, m.index).split("\n").length });
    }
}
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${manifest.length} snippets from ${scalaFiles.length} Scala files (${skippedInterpolated} interpolated strings skipped) in ${outDir}`);
