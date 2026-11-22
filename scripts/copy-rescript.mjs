#!/usr/bin/env node
/** Copy in-source ReScript `.res.mjs` outputs into `dist/` next to the TypeScript emit. */
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });
for (const name of readdirSync(src)) {
    if (!name.endsWith(".res.mjs")) continue;
    copyFileSync(join(src, name), join(dist, name));
}
