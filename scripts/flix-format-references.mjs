import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { findFixtures, loadFixture, relativeTo, withFlixFormat } from "../test/fixture.mjs";

const run = promisify(execFile);
const fixtures = fileURLToPath(new URL("../test/fixtures", import.meta.url));
const normalize = (text) => text.replace(/\x1b\[[0-9;]*m/g, "").replace(/\r\n/g, "\n");

async function readDiagnostics(path, fixture) {
    let output;
    try {
        output = normalize(await readFile(path, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return "";
        throw error;
    }
    const diagnostics = [...output.matchAll(/^-- (.+? \[E\d+\]) -+[^\n]*\n+>> ([^\n]+)/gm)]
        .map(([, header, message]) => `${header}: ${message.trimEnd()}\n`);
    if (diagnostics.length === 0) throw new Error(`Unrecognized Flix diagnostics for ${fixture.file}:\n${output}`);
    return diagnostics.join("");
}

async function capture(jar, version, selected) {
    const dir = await mkdtemp(join(tmpdir(), "flix-format-reference-"));
    try {
        const paths = [];
        for (const [index, [, fixture]] of selected.entries()) {
            const folder = join(dir, String(index));
            await mkdir(folder);
            const path = join(folder, "Fixture.flix");
            await writeFile(path, fixture.input.code);
            paths.push(path);
        }
        const driver = fileURLToPath(new URL("./FlixFormatReferences.java", import.meta.url));
        await run("java", ["--class-path", jar, driver, version, ...paths], { timeout: 300_000 });
        return await Promise.all(paths.map(async (path, index) => {
            const fixture = selected[index][1];
            const folder = dirname(path);
            const inputDiagnostics = await readDiagnostics(join(folder, "input-diagnostics.txt"), fixture);
            if (inputDiagnostics) return { language: "text", code: inputDiagnostics, outputDiagnostics: "" };
            return {
                language: "flix",
                code: normalize(await readFile(path, "utf8")),
                outputDiagnostics: await readDiagnostics(join(folder, "output-diagnostics.txt"), fixture),
            };
        }));
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}

async function main() {
    const [jarArg, pinArg, mode, ...extra] = process.argv.slice(2);
    if (!jarArg || !pinArg || (mode !== undefined && mode !== "--update") || extra.length) {
        throw new Error("Usage: npm run test:flix-format -- <flix.jar> <pin.json> [--update]");
    }
    const jar = resolve(jarArg);
    const pin = JSON.parse(await readFile(pinArg, "utf8"));
    const version = pin.upstream.tag.replace(/^v/, "");
    const digest = createHash("sha256").update(await readFile(jar)).digest("hex");
    if (digest !== pin.oracleArtifact.sha256) throw new Error("The Flix JAR does not match the pinned digest");
    const selected = findFixtures(fixtures)
        .map((path) => [path, loadFixture(path, relativeTo(fixtures, path))])
        .filter(([, fixture]) => fixture.flixFormat);
    if (selected.length === 0) throw new Error("No Flix Format references found");
    for (const [, fixture] of selected) {
        if (fixture.meta.flixFormat !== version) throw new Error(`${fixture.file}: set flixFormat to "${version}" before regenerating`);
    }

    const outputs = await capture(jar, version, selected);
    const changes = [];
    let unexpectedValidity = false;
    for (const [index, [path, fixture]] of selected.entries()) {
        const actual = outputs[index];
        const invalid = actual.outputDiagnostics !== "";
        if (invalid !== (fixture.meta.flixFormatInvalid === true)) {
            unexpectedValidity = true;
            console.error(`${fixture.file}: Flix output validity changed`);
        }
        if (invalid) console.log(`${fixture.file}: Flix output fails to type-check:\n${actual.outputDiagnostics.trimEnd()}`);
        const saved = fixture.flixFormat;
        if (saved.language !== actual.language || saved.code !== actual.code) {
            changes.push({ path, fixture, actual });
        }
        const comparison = actual.language === "text" ? "Flix declined to format" :
            fixture.outputs.some((block) => block.code === actual.code) ? "matches a Prettier snapshot" : "differs from Prettier snapshots";
        console.log(`${fixture.file}: ${comparison}`);
    }
    if (unexpectedValidity) {
        process.exitCode = 1;
        return;
    }
    for (const { path, fixture, actual } of changes) {
        if (mode === "--update") await writeFile(path, withFlixFormat(fixture, actual));
        console.log(`${fixture.file}: ${mode === "--update" ? "reference updated" : "reference changed"}`);
    }
    if (changes.length && mode !== "--update") process.exitCode = 1;
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
