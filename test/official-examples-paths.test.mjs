import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = ".github/workflows/official-examples.yml";
const entry = "scripts/audit-flix-examples.mjs";
const watchedDirs = ["scripts/", "test/", "src/"];

function pullRequestPaths(text) {
    const lines = text.split("\n");
    const start = lines.findIndex((line) => /^ {2}pull_request:\s*$/.test(line));
    assert.notEqual(start, -1, `${workflow} has no pull_request trigger`);
    const header = lines.findIndex((line, index) => index > start && /^ {4}paths:\s*$/.test(line));
    assert.notEqual(header, -1, `${workflow} has no pull_request paths`);
    const paths = [];
    for (const line of lines.slice(header + 1)) {
        const item = /^ {6}- "?([^"#]+?)"?\s*$/.exec(line);
        if (!item) break;
        paths.push(item[1]);
    }
    return paths;
}

function localImports(file) {
    const source = readFileSync(resolve(root, file), "utf8");
    const specifiers = [...source.matchAll(/^\s*(?:import|export)\b(?:[^;]*?\bfrom)?\s*["'](\.[^"']+)["']/gms)].map((m) => m[1]);
    return specifiers
        .map((specifier) => relative(root, resolve(root, dirname(file), specifier)).split("\\").join("/"))
        .filter((path) => watchedDirs.some((dir) => path.startsWith(dir)) && existsSync(resolve(root, path)));
}

function transitiveImports(file) {
    const seen = new Set([file]);
    const queue = [file];
    while (queue.length > 0) {
        for (const next of localImports(queue.shift())) {
            if (!seen.has(next)) {
                seen.add(next);
                queue.push(next);
            }
        }
    }
    return [...seen];
}

function covered(file, paths) {
    return paths.some((path) => path === file || (path.endsWith("/**") && file.startsWith(path.slice(0, -2))));
}

test("official examples workflow paths cover the audit script and its imports", () => {
    const paths = pullRequestPaths(readFileSync(resolve(root, workflow), "utf8"));
    const uncovered = transitiveImports(entry).filter((file) => !covered(file, paths));
    assert.deepEqual(uncovered, [], `${workflow} pull_request paths miss: ${uncovered.join(", ")}`);
});
