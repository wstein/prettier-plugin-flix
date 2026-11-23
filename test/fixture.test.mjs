import test from "node:test";
import assert from "node:assert/strict";
import { optionsFor, parseFixture, withFlixFormat, withOutputs } from "./fixture.mjs";

const fence = "```";
const sample = (front, body) => `---\n${front}\n---\n\n${body}`;
const good = sample(
    'title: Demo\noptions: { printWidth: 60 }',
    `## Input\n\n${fence}flix\ndef  f(): Int32 = 1\n${fence}\n\n## Output\n\n${fence}flix\ndef f(): Int32 = 1\n${fence}\n\n${fence}flix printWidth=20 tabWidth=2\ndef f(): Int32 =\n  1\n${fence}\n`,
);

test("parses front matter, input and several outputs", () => {
    const f = parseFixture(good);
    assert.equal(f.meta.title, "Demo");
    assert.equal(f.meta.status, "pass");
    assert.equal(f.input.code, "def  f(): Int32 = 1\n");
    assert.equal(f.outputs.length, 2);
    assert.deepEqual(optionsFor(f, f.outputs[0]), { printWidth: 60 });
    assert.deepEqual(optionsFor(f, f.outputs[1]), { printWidth: 20, tabWidth: 2 });
});

test("rewrites only the output blocks", () => {
    const f = parseFixture(good);
    const updated = withOutputs(f, ["NEW1\n", "NEW2\nline\n"]);
    assert.ok(updated.includes("NEW1\n"));
    assert.ok(updated.includes("NEW2\nline\n"));
    assert.ok(updated.includes("def  f(): Int32 = 1\n")); // the input is untouched
    const again = parseFixture(updated);
    assert.equal(again.outputs[0].code, "NEW1\n");
    assert.equal(again.outputs[1].code, "NEW2\nline\n");
    assert.equal(withOutputs(f, f.outputs.map((o) => o.code)), good);
});

test("an empty output is an empty block", () => {
    const f = parseFixture(good);
    assert.equal(parseFixture(withOutputs(f, ["", "x\n"])).outputs[0].code, "");
});

test("status: error takes no output", () => {
    const f = parseFixture(sample('title: Bad\nstatus: error', `## Input\n\n${fence}flix\ndef (\n${fence}\n`));
    assert.equal(f.outputs.length, 0);
});

const rejects = (name, text, message) =>
    test(`rejects: ${name}`, () => assert.throws(() => parseFixture(text, "x.md"), message));

rejects("missing front matter", "## Input\n", /must start with a ---/);
rejects("unclosed front matter", "---\ntitle: a\n", /not closed/);
rejects("unknown key", sample('title: a\nnonsense: 1', ""), /unknown front matter key "nonsense"/);
rejects("missing title", sample('minVersion: "0.80.0"', ""), /non-empty title/);
rejects("bad minVersion", sample('title: a\nminVersion: "0.80"', ""), /exact Flix version/);
rejects("bad maxVersion", sample('title: a\nmaxVersion: "0.80"', ""), /exact Flix version/);
rejects("minVersion after maxVersion", sample('title: a\nminVersion: "0.80.0"\nmaxVersion: "0.79.0"', ""), /minVersion 0\.80\.0 is after maxVersion 0\.79\.0/);
rejects("unknown flix key", sample('title: a\nflix: "0.80"', ""), /unknown front matter key "flix"/);
rejects("bad status", sample('title: a\nstatus: maybe', ""), /status must be one of/);
rejects("unknown option", sample('title: a\noptions: { semi: true }', ""), /unknown option "semi"/);
rejects("non-exact flixVersion in options", sample('title: a\noptions: { flixVersion: "0.79" }', ""), /exact Flix version/);
const withOptions = (value) => sample(`title: a\noptions: ${value}`, "");
rejects("scalar options", withOptions("42"), /"options" must be a mapping/);
rejects("sequence options", withOptions("[]"), /"options" must be a mapping/);
rejects("empty options", withOptions(""), /"options" must be a mapping/);
rejects("string option value", withOptions('{ printWidth: "80" }'), /option "printWidth" must be a positive integer, found "80"/);
rejects("fractional option value", withOptions("{ tabWidth: 2.5 }"), /positive integer/);
rejects("zero option value", withOptions("{ printWidth: 0 }"), /positive integer/);
rejects("misspelled boolean in options", withOptions("{ useTabs: treu }"), /option "useTabs" must be true or false/);
rejects("untagged block", sample('title: a', `## Input\n\n${fence}\nx\n${fence}\n`), /tagged "flix"/);
rejects("no input", sample('title: a', `## Output\n\n${fence}flix\nx\n${fence}\n`), /exactly one Input block, found 0/);
rejects("no output", sample('title: a', `## Input\n\n${fence}flix\nx\n${fence}\n`), /at least one Output block/);
rejects("unclosed block", sample('title: a', `## Input\n\n${fence}flix\nx\n`), /not closed/);
rejects("option on first output", sample('title: a', `## Input\n\n${fence}flix\nx\n${fence}\n## Output\n${fence}flix printWidth=9\nx\n${fence}\n`), /first Output block takes no options/);
rejects("unknown section", sample('title: a', "## Notes\n"), /unknown section "## Notes"/);

const withInfo = (info) => sample('title: a', `## Input\n\n${fence}flix\nx\n${fence}\n\n## Output\n\n${fence}flix\nx\n${fence}\n\n${fence}flix ${info}\nx\n${fence}\n`);
rejects("misspelled boolean", withInfo("useTabs=treu"), /option "useTabs" must be true or false, found "treu"/);
rejects("non-numeric width", withInfo("printWidth=abc"), /option "printWidth" must be a positive integer, found "abc"/);
rejects("fractional width", withInfo("tabWidth=2.5"), /positive integer/);
rejects("zero width", withInfo("printWidth=0"), /positive integer/);
rejects("negative width", withInfo("printWidth=-4"), /positive integer/);
rejects("empty value", withInfo("printWidth="), /positive integer, found ""/);
rejects("duplicate option", withInfo("printWidth=30 printWidth=60"), /duplicate option "printWidth"/);
rejects("unknown inline option", withInfo("semi=true"), /unknown option "semi"/);
rejects("non-exact inline flixVersion", withInfo("flixVersion=0.79"), /exact Flix version/);

test("accepts literal booleans and integers inline", () => {
    const f = parseFixture(withInfo("useTabs=true tabWidth=8 printWidth=100"));
    assert.deepEqual(f.outputs[1].options, { useTabs: true, tabWidth: 8, printWidth: 100 });
    assert.deepEqual(parseFixture(withInfo("useTabs=false")).outputs[1].options, { useTabs: false });
});

test("accepts exact flixVersion inline and in front matter", () => {
    assert.deepEqual(parseFixture(withInfo("flixVersion=0.79.0")).outputs[1].options, { flixVersion: "0.79.0" });
    const f = parseFixture(sample('title: a\nminVersion: "0.79.0"\nmaxVersion: "0.79.0"\noptions: { flixVersion: "0.79.0" }', `## Input\n\n${fence}flix\nx\n${fence}\n\n## Output\n\n${fence}flix\nx\n${fence}\n`));
    assert.deepEqual(f.meta.options, { flixVersion: "0.79.0" });
});

test("parses CRLF fixtures like LF fixtures", () => {
    const lf = parseFixture(good);
    const crlf = parseFixture(good.replace(/\n/g, "\r\n"));
    assert.equal(crlf.eol, "\r\n");
    assert.equal(lf.eol, "\n");
    assert.deepEqual(crlf.meta, lf.meta);
    assert.equal(crlf.input.code, lf.input.code);
    assert.deepEqual(crlf.outputs.map((o) => [o.options, o.code]), lf.outputs.map((o) => [o.options, o.code]));
});

test("keeps the newline convention when rewriting outputs", () => {
    const crlf = parseFixture(good.replace(/\n/g, "\r\n"));
    const updated = withOutputs(crlf, ["NEW1\n", "NEW2\n"]);
    assert.ok(!/[^\r]\n/.test(updated), "no bare LF may remain in a CRLF file");
    assert.equal(parseFixture(updated).outputs[0].code, "NEW1\n");
    assert.equal(withOutputs(crlf, crlf.outputs.map((o) => o.code)), good.replace(/\n/g, "\r\n"));
    assert.ok(!updated.includes("\r\r"));
});

test("a todo fixture takes exactly one output block", () => {
    const one = sample('title: a\nstatus: todo', `## Input\n\n${fence}flix\nx\n${fence}\n\n## Output\n\n${fence}flix\ny\n${fence}\n`);
    assert.equal(parseFixture(one).meta.status, "todo");
    const two = one + `\n${fence}flix printWidth=20\nz\n${fence}\n`;
    assert.throws(() => parseFixture(two, "x.md"), /status: todo fixtures take exactly one Output block/);
    assert.equal(parseFixture(two.replace("status: todo", "status: pass")).outputs.length, 2);
});

const reference = (language, code) => `\n## Flix Format\n\n${fence}${language}\n${code}${fence}\n`;
const versioned = good.replace('options:', 'flixFormat: "0.80.0"\noptions:');

test("keeps a versioned Flix Format reference independent of Prettier output", () => {
    const source = (versioned + reference("flix", "intentionally invalid Flix\n")).replaceAll("\n", "\r\n");
    const fixture = parseFixture(source);
    assert.equal(fixture.meta.flixFormat, "0.80.0");
    assert.equal(fixture.flixFormat.language, "flix");
    assert.equal(fixture.flixFormat.code, "intentionally invalid Flix\n");
    assert.equal(fixture.outputs.length, 2);

    const changed = withFlixFormat(fixture, { language: "text", code: "Parse Error [E1234]: example\n" });
    assert.equal(changed, source.replace(fence + "flix\r\nintentionally invalid Flix", fence + "text\r\nParse Error [E1234]: example"));
    const updated = parseFixture(withOutputs(parseFixture(changed), ["a\n", "b\n"]));
    assert.equal(updated.flixFormat.code, "Parse Error [E1234]: example\n");
    assert.deepEqual(updated.outputs.map((block) => block.code), ["a\n", "b\n"]);
});

test("requires one correctly tagged reference and an exact version", () => {
    const validBlock = reference("flix", "def f(): Int32 = 1\n");
    assert.throws(() => parseFixture(good + validBlock), /requires a "flixFormat" version/);
    assert.throws(() => parseFixture(versioned), /requires a Flix Format section/);
    assert.throws(() => parseFixture(versioned.replace("0.80.0", "0.80") + validBlock), /major.minor.patch/);
    assert.throws(() => parseFixture(versioned + "\n## Flix Format\n"), /exactly one block/);
    assert.throws(() => parseFixture(versioned + validBlock + validBlock), /duplicate Flix Format section/);
    assert.throws(() => parseFixture(versioned + reference("flix printWidth=20", "")), /must be tagged/);
});

test("requires explicit acceptance of a compiler-invalid Flix reference", () => {
    const source = versioned.replace('flixFormat: "0.80.0"', 'flixFormat: "0.80.0"\nflixFormatInvalid: true');
    const diagnostics = "\n## Flix Format Diagnostics\n\n" + fence + "text\nType Error [E1234]: example\n" + fence + "\n";
    assert.equal(parseFixture(source + reference("flix", "invalid\n") + diagnostics).meta.flixFormatInvalid, true);
    assert.throws(() => parseFixture(source + reference("text", "diagnostic\n")), /requires a Flix Format code block/);
    assert.throws(() => parseFixture(source.replace(": true", ": false") + reference("flix", "invalid\n")), /must be true/);
});

const diagnosticsBlock = (code = "Type Error [E1234]: example\n", language = "text") => `\n## Flix Format Diagnostics\n\n${fence}${language}\n${code}${fence}\n`;
const invalidSource = versioned.replace('flixFormat: "0.80.0"', 'flixFormat: "0.80.0"\nflixFormatInvalid: true');

test("a flixFormatInvalid reference records its output diagnostics", () => {
    const source = invalidSource + reference("flix", "invalid\n") + diagnosticsBlock();
    const fixture = parseFixture(source);
    assert.equal(fixture.flixFormatDiagnostics.code, "Type Error [E1234]: example\n");
    const changed = withFlixFormat(fixture, { language: "flix", code: "other\n", outputDiagnostics: "Type Error [E9999]: new\nResolution Error [E2136]: x\n" });
    const again = parseFixture(changed);
    assert.equal(again.flixFormat.code, "other\n");
    assert.equal(again.flixFormatDiagnostics.code, "Type Error [E9999]: new\nResolution Error [E2136]: x\n");
    assert.equal(withFlixFormat(fixture, { language: "flix", code: "invalid\n", outputDiagnostics: fixture.flixFormatDiagnostics.code }), source);
    // A fixture without a diagnostics block ignores outputDiagnostics.
    const plain = parseFixture(versioned + reference("flix", "x\n"));
    assert.equal(withFlixFormat(plain, { language: "flix", code: "x\n", outputDiagnostics: "ignored\n" }), versioned + reference("flix", "x\n"));
});

test("Flix Format Diagnostics and flixFormatInvalid require each other", () => {
    assert.throws(() => parseFixture(invalidSource + reference("flix", "invalid\n")), /requires a Flix Format Diagnostics section/);
    assert.throws(() => parseFixture(versioned + reference("flix", "x\n") + diagnosticsBlock()), /requires flixFormatInvalid: true/);
    assert.throws(() => parseFixture(invalidSource + reference("flix", "x\n") + diagnosticsBlock() + diagnosticsBlock()), /duplicate Flix Format Diagnostics/);
    assert.throws(() => parseFixture(invalidSource + reference("flix", "x\n") + "\n## Flix Format Diagnostics\n"), /exactly one block/);
    assert.throws(() => parseFixture(invalidSource + reference("flix", "x\n") + diagnosticsBlock("x\n", "flix")), /must be tagged "text"/);
    assert.throws(() => parseFixture(invalidSource + diagnosticsBlock() + reference("flix", "x\n")), /must follow ## Flix Format/);
});

test("the reference sections must follow Input and Output", () => {
    const front = 'title: a\nminVersion: "0.80.0"\nflixFormat: "0.80.0"';
    const input = `## Input\n\n${fence}flix\nx\n${fence}\n`;
    const output = `\n## Output\n\n${fence}flix\nx\n${fence}\n`;
    const ref = reference("flix", "x\n");
    assert.ok(parseFixture(sample(front, input + output + ref)));
    assert.throws(() => parseFixture(sample(front, ref.trimStart() + input + output)), /must come after ## Input and ## Output/);
    assert.throws(() => parseFixture(sample(front, input + ref + output)), /must come after ## Input and ## Output/);
    assert.throws(() => parseFixture(sample(front, ref.trimStart() + input)), /must come after ## Input and ## Output/);
});

test("the flixFormat version must share major.minor with minVersion when set", () => {
    assert.throws(() => parseFixture(good.replace('options:', 'minVersion: "0.80.0"\nflixFormat: "0.81.0"\noptions:') + reference("flix", "x\n")), /share major\.minor/);
    assert.ok(parseFixture(good.replace('options:', 'minVersion: "0.80.0"\nflixFormat: "0.80.7"\noptions:') + reference("flix", "x\n")));
});

test("status: error fixtures cannot have a reference", () => {
    const source = sample('title: Bad\nstatus: error\nflixFormat: "0.80.0"', `## Input\n\n${fence}flix\ndef (\n${fence}\n${reference("text", "x\n")}`);
    assert.throws(() => parseFixture(source), /status: error fixtures cannot have a Flix Format reference/);
});

test("Output and reference updates compose in either order", () => {
    const fixture = parseFixture(versioned + reference("flix", "ref\nmore\n"));
    const outputFirst = parseFixture(withOutputs(fixture, ["A\nB\n", "C\n"]));
    const both = parseFixture(withFlixFormat(outputFirst, { language: "text", code: "T\n" }));
    assert.deepEqual(both.outputs.map((b) => b.code), ["A\nB\n", "C\n"]);
    assert.equal(both.flixFormat.code, "T\n");
    const referenceFirst = parseFixture(withFlixFormat(fixture, { language: "text", code: "T\n" }));
    const final = parseFixture(withOutputs(referenceFirst, ["A\nB\n", "C\n"]));
    assert.equal(final.flixFormat.code, "T\n");
    assert.deepEqual(final.outputs.map((b) => b.code), ["A\nB\n", "C\n"]);
});
