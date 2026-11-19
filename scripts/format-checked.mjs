import { readFile, writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";
import plugin from "../dist/index.js";
import { fingerprint, programProblems } from "../test/lib.mjs";

const paths = [...new Set(process.argv.slice(2))];

async function main() {
    if (paths.length === 0) throw new Error("Usage: npm run format:checked -- <file.flix>...");

    const changes = [];
    for (const filepath of paths) {
        if (!filepath.endsWith(".flix")) throw new Error(`${filepath}: expected a .flix file`);
        const original = await readFile(filepath, "utf8");
        const config = await resolveConfig(filepath, { editorconfig: true });
        const options = {
            ...config,
            filepath,
            parser: "flix",
            plugins: [...(config?.plugins ?? []), plugin],
            rangeStart: 0,
            rangeEnd: Infinity,
            cursorOffset: -1,
        };
        const before = fingerprint(original);
        if (before.errors.length) throw new Error(`${filepath}: input does not parse: ${before.errors[0]}`);

        const formatted = await format(original, options);
        const problems = programProblems(before, formatted === original ? before : fingerprint(formatted));
        if (problems.length) throw new Error(`${filepath}: refused to write: ${problems.join(", ")}`);
        if (formatted === original) continue;
        if (await format(formatted, options) !== formatted) {
            throw new Error(`${filepath}: refused to write: formatting is not idempotent`);
        }
        changes.push({ filepath, original, formatted });
    }

    for (const { filepath, original } of changes) {
        if (await readFile(filepath, "utf8") !== original) {
            throw new Error(`${filepath}: file changed during formatting`);
        }
    }
    for (const { filepath, formatted } of changes) {
        await writeFile(filepath, formatted);
        console.log(filepath);
    }
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
