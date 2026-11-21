import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFixture, optionsFor } from "../test/fixture.mjs";
import { readHandoff, writeHandoff } from "../docs/assets/js/playground-link.js";
import { playgroundIndentation } from "../docs/assets/js/playground-options.js";
import { fingerprint, fmt, programProblems } from "../test/lib.mjs";

const site = new URL("../docs/public/", import.meta.url);
const page = await readFile(new URL("playground/index.html", site), "utf8");
const asset = page.match(/\bdata-formatter=(?:"([^"]+)"|([^\s>]+))/);
assert.ok(asset, "Playground page links to its formatter bundle");
const { formatFlix, formatFlixPreview } = await import(new URL(`js/${basename(asset[1] ?? asset[2])}`, site));

test("the published worker loads the published formatter and replies to requests", async () => {
    const workerAsset = page.match(/\bdata-worker=(?:"([^"]+)"|([^\s>]+))/);
    assert.ok(workerAsset, "Playground page links to its worker");
    const workerUrl = new URL(`js/${basename(workerAsset[1] ?? workerAsset[2])}`, site);
    let receive;
    const reply = Promise.withResolvers();
    globalThis.self = {
        location: { href: workerUrl.href },
        addEventListener: (name, listener) => {
            assert.equal(name, "message");
            receive = listener;
        },
        postMessage: reply.resolve,
    };
    try {
        await import(workerUrl);
        await receive({ data: { id: 7, asset: basename(asset[1] ?? asset[2]), source: "def worker():Int32=7", options: {} } });
        assert.deepEqual(await reply.promise, { id: 7, output: "def worker(): Int32 = 7\n" });
    } finally {
        delete globalThis.self;
    }
});

test("the formatting reference publishes highlighted examples and links to catalog fixtures", async () => {
    const [source, guide, home] = await Promise.all([
        readFile(new URL("../docs/formatting.md", import.meta.url), "utf8"),
        readFile(new URL("formatting/index.html", site), "utf8"),
        readFile(new URL("index.html", site), "utf8"),
    ]);
    assert.match(home, /href=(?:"[^"]*\/formatting\/"|[^\s>]*\/formatting\/)>Read the formatting style/);
    assert.match(guide, /<h1[^>]*>Flix formatting style<\/h1>/);
    const sourceBlocks = source.match(/^```flix$/gm) ?? [];
    assert.ok(sourceBlocks.length > 0);
    assert.equal((guide.match(/<pre class=(?:"shiki\b|shiki\b)/g) ?? []).length, sourceBlocks.length);

    const fixtures = [...source.matchAll(/\]\(\.\.\/test\/fixtures\/([\w-]+)\/([\w-]+)\.md\)/g)];
    assert.ok(fixtures.length > 0);
    for (const [, chapter, id] of fixtures) {
        const link = new RegExp(`href=(?:"[^"]*/${chapter}/#${id}"|[^\\s>]*/${chapter}/#${id})(?=[\\s>])`);
        assert.match(guide, link, `guide should link to ${chapter}/#${id}`);
        const chapterPage = await readFile(new URL(`${chapter}/index.html`, site), "utf8");
        assert.match(chapterPage, new RegExp(`<article id=(?:"${id}"|${id})(?=[\\s>])`));
    }
});

test("the published browser bundle matches CLI and fixture output", async () => {
    const path = fileURLToPath(new URL("../test/fixtures/expressions/align-map-comment.md", import.meta.url));
    const fixture = loadFixture(path);
    for (const block of fixture.outputs) {
        const options = optionsFor(fixture, block);
        const output = await formatFlix(fixture.input.code, options);
        assert.equal(output, await fmt(fixture.input.code, options));
        assert.equal(output, block.code);
    }
});

test("the published browser bundle reports syntax error locations", async () => {
    await assert.rejects(() => formatFlix("def", {}), (error) =>
        error instanceof SyntaxError && error.loc?.start.line === 1 && error.loc.start.column > 0,
    );
});

test("the preview formats declarations around a damaged declaration and returns its error", async () => {
    const eol = "\r\n";
    const bad = "def broken(x:Int32:Int32=x  // retain this text  ";
    const source = ['def first():String="München 🍊"', bad, "@Test", "def next():Int32=2", ""].join(eol);
    await assert.rejects(() => formatFlix(source, {}), SyntaxError);
    const preview = await formatFlixPreview(source, {});
    assert.equal(preview.output, ['def first(): String = "München 🍊"', bad, "@Test", "def next(): Int32 = 2", ""].join(eol));
    assert.equal(preview.error.location.line, 2);
    const fixed = source.replace(bad, "def broken(x:Int32):Int32=x");
    assert.deepEqual(await formatFlixPreview(fixed, {}), { output: await formatFlix(fixed, {}) });
});

test("the preview resumes at rule, enum case and struct field boundaries", async () => {
    const cases = [
        {
            source: ["def rules() = #{", " A( 1). // first", " Broken(x) :- .", " C( Mod.f(3) ).", "}", ""],
            expected: ["def rules() = #{", "    A(1).  // first", " Broken(x) :- .", "    C(Mod.f(3)).", "}", ""],
        },
        {
            source: ["enum Choice {", " case A (Int32,String)", " case Broken(,)", " case C (Int32)", "}", ""],
            expected: ["enum Choice {", "    case A(Int32, String)", " case Broken(,)", "    case C(Int32)", "}", ""],
        },
        {
            source: ["struct Fields {", " a:Int32,", " broken: ,", " c:String", "}", ""],
            expected: ["struct Fields {", "    a: Int32,", " broken: ,", "    c: String", "}", ""],
        },
        {
            source: ["mod Example {", "    def first():Int32=1", "    def broken():Int32=", "    pub def next():Int32=2", "}", ""],
            expected: ["mod Example {", "    def first(): Int32 = 1", "    def broken():Int32=", "    pub def next(): Int32 = 2", "}", ""],
        },
    ];
    for (const { source, expected } of cases) {
        const preview = await formatFlixPreview(source.join("\n"), {});
        assert.equal(preview.output, expected.join("\n"), source.join("\n"));
        assert.ok(preview.error?.location);
        assert.equal((await formatFlixPreview(preview.output, {})).output, undefined);
    }
});

test("the preview keeps the tail of an unclosed block and leaves valid neighboring units alone", async () => {
    const bad = "def bad():Int32={\n  1 +\ndef ambiguous():Int32=2\n";
    // Recovery still formats the following def when an unclosed `{` does not
    // swallow it; the damaged opener stays verbatim.
    const recovered = "def first(): Int32 = 1\ndef bad():Int32={\n  1 +\ndef ambiguous(): Int32 = 2\n";
    assert.equal((await formatFlixPreview("def first():Int32=1\n" + bad, {})).output, recovered);
    const valid = "def first(): Int32 = 1\n";
    const partial = await formatFlixPreview(valid + bad, {});
    assert.equal(partial.output, recovered);
    assert.ok(partial.error?.message);
    // The workbench shows the current source and a "Not formatted" status when
    // recovery returns no output; see check-playground-browser.spec.mjs.
    const comment = "/* unclosed comment\ndef notCode():Int32=2\n";
    assert.equal((await formatFlixPreview("def first():Int32=1\n" + comment, {})).output,
        "def first(): Int32 = 1\n" + comment);
    const quoted = 'def valid(): String = "def pretend():Int32=1"\n';
    assert.equal((await formatFlixPreview(quoted + "def bad():Int32=\n", {})).output, undefined);
});

test("the browser formatter points to the backslash before a real newline", async () => {
    const prefix = 'def receipt(): String = "${123} 🚉 ';
    for (const newline of ["\n", "\r\n", "\r"]) {
        const input = prefix + "\\" + newline + 'including shipping"\n';
        await assert.rejects(() => formatFlix(input, {}), (error) => {
            assert.match(error.message, /backslash cannot continue a string/);
            assert.deepEqual(error.loc?.start, { line: 1, column: Array.from(prefix).length + 1 });
            return true;
        });
    }
    const valid = String.raw`def receipt(): String = "cents\nincluding shipping"` + "\n";
    assert.equal(await formatFlix(valid, {}), valid);
});

test("the standalone Playground and formatter default to 100 columns", async () => {
    assert.match(page, /data-print-width[^>]*\bvalue=(?:"100"|100)(?:\s|>)/);
    assert.match(page, /data-cursor-position[^>]*>Ln 1, Col 1/);
    assert.match(page, /playground-statusbar[^>]*>\s*<p[^>]*role=(?:"status"|status)>Loading the editor…/);
    const input = 'def sample(): Bool = verifyExample("a moderately long argument", "a second moderately long argument")';
    const defaultOutput = await formatFlix(input, {});
    assert.equal(defaultOutput, await fmt(input, { printWidth: 100 }));
    assert.notEqual(defaultOutput, await formatFlix(input, { printWidth: 80 }));
});

test("embedded examples open with their 60-column preview", async () => {
    const catalog = JSON.parse(await readFile(new URL("../docs/data/fixtures.json", import.meta.url), "utf8"));
    const fixture = catalog.datalog.groups.flatMap((group) => group.fixtures).find((item) => item.path === "datalog/transit.md");
    const { source, output, ...options } = fixture.initial;
    assert.equal(options.printWidth, 60);
    assert.equal(output, await formatFlix(source, options));
    const chapter = await readFile(new URL("datalog/index.html", site), "utf8");
    assert.match(chapter, /data-print-width[^>]*\bvalue=(?:"60"|60)(?:\s|>)/);
});

test("the Playground and embedded editors have fixed four-space indentation", async () => {
    const optionsPage = await readFile(new URL("options/index.html", site), "utf8");
    assert.doesNotMatch(page, /data-tab-width/);
    assert.doesNotMatch(optionsPage, /data-tab-width/);
    const catalog = JSON.parse(await readFile(new URL("../docs/data/fixtures.json", import.meta.url), "utf8"));
    const fixtures = catalog.options.groups.flatMap((group) => group.fixtures);
    for (const id of ["tab-width", "use-tabs"]) {
        const { initial, outputs } = fixtures.find((fixture) => fixture.id === id);
        assert.equal(outputs[1].playgroundCompatible, false);
        assert.equal(initial.output, await formatFlix(initial.source, { printWidth: initial.printWidth, ...playgroundIndentation }));
        assert.doesNotMatch(optionsPage, new RegExp(`fixture=options%2F${id}\\.md(?:&amp;|&)variant=1`, "i"));
    }
    assert.deepEqual(playgroundIndentation, { tabWidth: 4, useTabs: false });
});

test("all curated examples match their fixtures in the published browser bundle", async () => {
    const data = await readFile(new URL("../docs/data/playground.json", import.meta.url), "utf8");
    const { fixtures } = JSON.parse(data);
    for (const [path, { input, options }] of Object.entries(fixtures)) {
        const fixture = loadFixture(fileURLToPath(new URL(`../test/fixtures/${path}`, import.meta.url)));
        assert.equal(input, fixture.input.code, path);
        assert.deepEqual(options, fixture.outputs.map((block) => optionsFor(fixture, block)), path);
        const original = fingerprint(input);
        assert.deepEqual(original.errors, [], path);
        for (const [index, block] of fixture.outputs.entries()) {
            const settings = options[index];
            const output = await formatFlix(input, settings);
            assert.equal(output, block.code, path);
            assert.deepEqual(programProblems(original, fingerprint(output)), [], path);
            assert.equal(await formatFlix(output, settings), output, path);
        }
    }
});

test("the Playground handoff preserves Unicode source and line width in a URL fragment", () => {
    const draft = { source: 'pub def board(): String = "🚉 Köln & Zürich"\n', printWidth: 47 };
    const url = new URL(writeHandoff("https://example.test/flix/playground/?fixture=strings%2Fitinerary.md", draft));
    assert.equal(url.searchParams.get("fixture"), "strings/itinerary.md");
    assert.doesNotMatch(url.hash, /tabWidth|useTabs/);
    assert.deepEqual(readHandoff(url.hash), draft);
    assert.deepEqual(readHandoff(url.hash + "&tabWidth=2&useTabs=true"), draft);
    const unconfigured = new URL(writeHandoff(url.href, { source: draft.source }));
    assert.equal(new URLSearchParams(unconfigured.hash.slice(1)).has("printWidth"), false);
    assert.deepEqual(readHandoff(unconfigured.hash), { source: draft.source, printWidth: undefined });
    assert.equal(readHandoff("#code=%21"), undefined);
});
