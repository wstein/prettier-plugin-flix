import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHighlighter } from "shiki";
import { flixThemes } from "../docs/assets/js/flix-themes.js";
import {
    playgroundDefaultFlixVersion,
    playgroundFlixVersions,
    playgroundIndentation,
} from "../docs/assets/js/playground-options.js";
import { DEFAULT_FLIX_VERSION, SUPPORTED_FLIX_VERSIONS, defaultOptions } from "../dist/index.js";
import { EXAMPLE_PRINT_WIDTH, findFixtures, loadFixture, optionsFor, relativeTo } from "../test/fixture.mjs";
import { fmt } from "../test/lib.mjs";

const root = fileURLToPath(new URL("../test/fixtures", import.meta.url));
const destination = new URL("../docs/data/", import.meta.url);
const chapters = {};
const showcase = [];
const playgroundFixtures = {};
const passingFixtures = new Set();
const EMBEDDED_PRINT_WIDTH = 60;
const playground = {
    defaultFixture: "datalog/transit.md",
    groups: [
        {
            title: "Data and logic",
            examples: [
                ["Transit routes", "datalog/transit.md"],
                ["Room area and labels", "expressions/shape-report.md"],
            ],
        },
        {
            title: "Everyday programs",
            examples: [
                ["Departure board", "strings/itinerary.md"],
                ["Checkout and shipping", "declarations/checkout.md"],
            ],
        },
        {
            title: "Effects and parallelism",
            examples: [
                ["Currency quote", "declarations/rate-quote.md"],
                ["Parallel scoreboard", "expressions/scoreboard.md"],
            ],
        },
    ],
};
const grammar = JSON.parse(await readFile(new URL("../docs/syntax/flix.tmLanguage.json", import.meta.url), "utf8"));
const themes = { light: flixThemes.light.name, dark: flixThemes.dark.name };
const highlighter = await createHighlighter({
    langs: [{ ...grammar, name: "flix" }],
    themes: Object.values(flixThemes),
});
const highlight = (code) => highlighter.codeToHtml(code, {
    lang: "flix",
    themes,
    defaultColor: false,
});


function describeOptions(fixture, block) {
    const defaults = { ...defaultOptions, printWidth: EXAMPLE_PRINT_WIDTH, useTabs: false };
    const base = { ...defaults, ...fixture.meta.options };
    const configured = optionsFor(fixture, block);
    const effective = { ...defaults, ...configured };
    const notes = [];
    if (effective.printWidth !== base.printWidth) {
        notes.push(`Changes the preferred line width from ${base.printWidth} to ${effective.printWidth} columns.`);
    }
    if (effective.tabWidth !== base.tabWidth) {
        notes.push(`Changes each indentation level from ${base.tabWidth} to ${effective.tabWidth} columns.`);
    }
    if (effective.useTabs !== base.useTabs) {
        notes.push(effective.useTabs ? "Uses tabs for indentation." : "Uses spaces for indentation.");
    }
    return {
        options: Object.entries({ printWidth: defaults.printWidth, ...configured })
            .map(([key, value]) => `${key}: ${value}`).join(", "),
        note: notes.join(" "),
        playgroundCompatible: effective.tabWidth === playgroundIndentation.tabWidth &&
            effective.useTabs === playgroundIndentation.useTabs,
    };
}

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
    const liveOptions = {
        printWidth: meta.options?.printWidth ?? EMBEDDED_PRINT_WIDTH,
        flixVersion: meta.options?.flixVersion,
        ...playgroundIndentation,
    };
    const firstOutput = outputs[0];
    const firstOutputOptions = firstOutput && optionsFor(fixture, firstOutput);
    const displayedOutputs = outputs.map((block) => ({
        html: highlight(block.code),
        ...describeOptions(fixture, block),
    }));
    const liveOutput = meta.status !== "pass" ? undefined :
        displayedOutputs[0].playgroundCompatible && liveOptions.printWidth === firstOutputOptions.printWidth &&
            (liveOptions.flixVersion ?? DEFAULT_FLIX_VERSION) === (firstOutputOptions.flixVersion ?? DEFAULT_FLIX_VERSION)
            ? firstOutput.code : await fmt(input.code, liveOptions);
    const example = {
        id: basename(relative, ".md"),
        path: relative,
        chapter,
        flix: meta.flix,
        flixVersion: liveOptions.flixVersion,
        upstreamUrl: typeof meta.source === "string" && meta.source.startsWith("https://") ? meta.source : undefined,
        title: meta.title,
        description: meta.description,
        status: meta.status,
        inputHtml: highlight(input.code),
        initial: {
            source: input.code,
            output: liveOutput,
            printWidth: liveOptions.printWidth,
            flixVersion: liveOptions.flixVersion,
        },
        outputs: displayedOutputs,
        reference,
    };
    group.fixtures.push(example);
    if (meta.showcase) showcase.push({ order: meta.showcase, example });
    if (meta.status === "pass") passingFixtures.add(relative);
    playgroundFixtures[relative] = {
        title: meta.title,
        input: input.code,
        options: outputs.length > 0 ? outputs.map((block) => optionsFor(fixture, block)) : [meta.options],
    };
}

const formatting = await readFile(new URL("../docs/formatting.md", import.meta.url), "utf8");
const formattingHighlight = Object.fromEntries(
    [...formatting.matchAll(/^```flix[^\S\n]*\n([\s\S]*?)^```$/gm)]
        .map(([, code]) => [code.trimEnd(), highlight(code)]),
);
highlighter.dispose();
showcase.sort((a, b) => a.order - b.order);
chapters.examples = { count: showcase.length, groups: [{ title: "", fixtures: showcase.map(({ example }) => example) }] };
await mkdir(destination, { recursive: true });
await writeFile(new URL("formattingHighlight.json", destination), JSON.stringify(formattingHighlight) + "\n");
await writeFile(new URL("fixtures.json", destination), JSON.stringify(chapters, null, 2) + "\n");
const examples = {};
for (const group of playground.groups) {
    for (const [title, path] of group.examples) {
        if (!passingFixtures.has(path)) throw new Error(`Playground example must be a passing fixture: ${path}`);
        const fixture = playgroundFixtures[path];
        examples[path] = { ...fixture, title };
        // Preserve deep links that used the old standalone example filenames.
        playgroundFixtures[`examples/${basename(path, ".md")}.flix`] = fixture;
    }
}
if (!Object.hasOwn(examples, playground.defaultFixture)) throw new Error("The default playground fixture must be a menu example.");
if (playgroundDefaultFlixVersion !== DEFAULT_FLIX_VERSION) {
    throw new Error("Playground default Flix version must match DEFAULT_FLIX_VERSION.");
}
if (playgroundFlixVersions.join(",") !== [...SUPPORTED_FLIX_VERSIONS].join(",")) {
    throw new Error("Playground Flix versions must match SUPPORTED_FLIX_VERSIONS.");
}
await writeFile(new URL("playground.json", destination), JSON.stringify({
    ...playground, defaultOptions,
    embeddedPrintWidth: EMBEDDED_PRINT_WIDTH,
    defaultFlixVersion: playgroundDefaultFlixVersion,
    supportedFlixVersions: playgroundFlixVersions,
    fixtures: examples,
}) + "\n");
await writeFile(new URL("playgroundFixtures.json", destination), JSON.stringify(playgroundFixtures) + "\n");
