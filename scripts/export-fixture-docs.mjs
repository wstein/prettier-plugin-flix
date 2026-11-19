import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHighlighter } from "shiki";
import { findFixtures, loadFixture, optionsFor, relativeTo } from "../test/fixture.mjs";

const root = fileURLToPath(new URL("../test/fixtures", import.meta.url));
const destination = new URL("../docs/data/", import.meta.url);
const chapters = {};
const grammar = JSON.parse(await readFile(new URL("../docs/syntax/flix.tmLanguage.json", import.meta.url), "utf8"));
const themes = { light: "github-light", dark: "github-dark" };
const highlighter = await createHighlighter({
    langs: [{ ...grammar, name: "flix" }],
    themes: Object.values(themes),
});
const highlight = (code) => highlighter.codeToHtml(code, {
    lang: "flix",
    themes,
    defaultColor: false,
});


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
        code: flixFormat.language === "text" ? flixFormat.code : undefined,
        html: flixFormat.language === "flix" ? highlight(flixFormat.code) : undefined,
        note: fixture.lines.slice(referenceHeading + 1, flixFormat.start - 1).join("\n").trim(),
    };
    const entry = chapters[chapter] ??= { count: 0, groups: [] };
    const title = meta.group?.trim() ?? "";
    let group = entry.groups.find((item) => item.title === title);
    if (!group) {
        group = { title, fixtures: [] };
        entry.groups.push(group);
    }
    entry.count++;
    group.fixtures.push({
        id: basename(relative, ".md"),
        path: relative,
        title: meta.title,
        description: meta.description,
        status: meta.status,
        inputHtml: highlight(input.code),
        outputs: outputs.map((block) => ({
            html: highlight(block.code),
            options: Object.entries(optionsFor(fixture, block)).map(([key, value]) => `${key}: ${value}`).join(", "),
        })),
        reference,
    });
}

highlighter.dispose();
await mkdir(destination, { recursive: true });
await writeFile(new URL("fixtures.json", destination), JSON.stringify(chapters, null, 2) + "\n");
