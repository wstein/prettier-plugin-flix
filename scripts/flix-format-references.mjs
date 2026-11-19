import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { assess, normalize, summarizeDiagnostics, timeoutMs } from "./flix-format-lib.mjs";
import { findFixtures, loadFixture, relativeTo, withFlixFormat } from "../test/fixture.mjs";

const run = promisify(execFile);
const fixtures = fileURLToPath(new URL("../test/fixtures", import.meta.url));

async function readDiagnostics(path, fixture) {
    let output;
    try {
        output = await readFile(path, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") return "";
        throw error;
    }
    return summarizeDiagnostics(output, fixture.file);
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
        await run("java", ["--class-path", jar, driver, version, ...paths], { timeout: timeoutMs(selected.length, process.env) });
        return await Promise.all(paths.map(async (path, index) => {
            const fixture = selected[index][1];
            const folder = dirname(path);
            const crash = await readFile(join(folder, "crash.txt"), "utf8").catch((error) => {
                if (error.code === "ENOENT") return undefined;
                throw error;
            });
            if (crash !== undefined) return { crash };
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
    const args = process.argv.slice(2);
    const flags = args.filter((arg) => arg.startsWith("--"));
    const [jarArg, pinArg, ...extra] = args.filter((arg) => !arg.startsWith("--"));
    const update = flags.includes("--update");
    const verbose = flags.includes("--verbose");
    if (!jarArg || !pinArg || extra.length || flags.some((flag) => flag !== "--update" && flag !== "--verbose")) {
        throw new Error("Usage: npm run test:flix-format -- <flix.jar> <pin.json> [--update] [--verbose]");
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
    const entries = selected.map(([, fixture], index) => ({
        file: fixture.file,
        status: fixture.meta.status,
        outputs: fixture.outputs,
        invalid: fixture.meta.flixFormatInvalid === true,
        saved: { language: fixture.flixFormat.language, code: fixture.flixFormat.code, diagnostics: fixture.flixFormatDiagnostics?.code },
        actual: outputs[index],
        crash: outputs[index].crash,
    }));
    const { lines, writes, exitCode } = assess(entries, { update, verbose });
    for (const { error, text } of lines) (error ? console.error : console.log)(text);
    for (const index of writes) {
        const [path, fixture] = selected[index];
        await writeFile(path, withFlixFormat(fixture, outputs[index]));
    }
    process.exitCode = exitCode;
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
