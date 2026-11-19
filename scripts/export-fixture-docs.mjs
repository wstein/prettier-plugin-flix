import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { findFixtures, loadFixture, optionsFor, relativeTo } from "../test/fixture.mjs";

const root = fileURLToPath(new URL("../test/fixtures", import.meta.url));
const destination = new URL("../docs/data/", import.meta.url);
const chapters = {};

for (const path of findFixtures(root)) {
    const relative = relativeTo(root, path);
    const [chapter] = relative.split("/");
    const fixture = loadFixture(path, relative);
    const { meta, input, outputs, flixFormat } = fixture;
    const referenceHeading = fixture.lines.findIndex((line) => /^## Flix Format\s*$/.test(line));
    const reference = flixFormat && {
        version: meta.flixFormat,
        invalid: meta.flixFormatInvalid === true,
        language: flixFormat.language,
        code: flixFormat.code,
        note: fixture.lines.slice(referenceHeading + 1, flixFormat.start - 1).join("\n").trim(),
    };
    (chapters[chapter] ??= []).push({
        id: basename(relative, ".md"),
        path: relative,
        title: meta.title,
        description: meta.description,
        status: meta.status,
        input: input.code,
        outputs: outputs.map((block) => ({
            code: block.code,
            options: Object.entries(optionsFor(fixture, block)).map(([key, value]) => `${key}: ${value}`).join(", "),
        })),
        reference,
    });
}

await mkdir(destination, { recursive: true });
await writeFile(new URL("fixtures.json", destination), JSON.stringify(chapters, null, 2) + "\n");
