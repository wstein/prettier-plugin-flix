#!/usr/bin/env node
// Collects the Flix snippets from the issues of a GitHub repository, as extra inputs for
// scripts/check-corpus.mjs (they are real programs that triggered compiler bugs, so they stress
// unusual syntax).
//
//   node scripts/harvest-issues.mjs <out-dir> [--repo flix/flix] [--author wstein] [--state open]
//
// Reads the public GitHub REST API; set GITHUB_TOKEN to avoid the anonymous rate limit. For every
// matching issue the body and all comments are scanned; each code block that can hold Flix (see
// extractFlixBlocks) becomes issue-<number>-<n>.flix. manifest.json records the issue URL and where
// in it the block was found.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractFlixBlocks } from "./snippets.mjs";

const args = process.argv.slice(2);
const option = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const repo = option("--repo", "flix/flix");
const author = option("--author", "wstein");
const state = option("--state", "open");
const [outDir] = args;
if (!outDir) {
    console.error("usage: harvest-issues.mjs <out-dir> [--repo owner/name] [--author login] [--state open|closed|all]");
    process.exit(2);
}

const headers = { Accept: "application/vnd.github+json", "User-Agent": "prettier-plugin-flix-harvest" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function pages(url) {
    const out = [];
    for (let next = url; next; ) {
        const res = await fetch(next, { headers });
        if (!res.ok) throw new Error(`${next}: HTTP ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
        out.push(...(await res.json()));
        next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get("link") ?? "")?.[1] ?? null;
    }
    return out;
}

const issues = (await pages(`https://api.github.com/repos/${repo}/issues?creator=${encodeURIComponent(author)}&state=${state}&per_page=100`))
    .filter((i) => !i.pull_request);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const issue of issues) {
    const sources = [{ where: "body", text: issue.body ?? "" }];
    if (issue.comments > 0) {
        for (const c of await pages(`${issue.comments_url}?per_page=100`)) sources.push({ where: `comment ${c.html_url.split("#").pop()}`, text: c.body ?? "" });
    }
    let n = 0;
    for (const src of sources) {
        for (const block of extractFlixBlocks(src.text)) {
            n++;
            const file = `issue-${issue.number}-${String(n).padStart(2, "0")}.flix`;
            writeFileSync(join(outDir, file), block.code + "\n");
            manifest.push({ file, issue: issue.html_url, title: issue.title, where: src.where, line: block.line });
        }
    }
}
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${manifest.length} snippets from ${issues.length} issues of ${repo} by ${author} (${state}) in ${outDir}`);
