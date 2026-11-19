import test from "node:test";
import assert from "node:assert/strict";
import { optionsFor, parseFixture, withOutputs } from "./fixture.mjs";

const fence = "```";
const sample = (front, body) => `---\n${front}\n---\n\n${body}`;
const good = sample(
    'title: Demo\nflix: "0.80"\noptions: { printWidth: 60 }',
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
    const f = parseFixture(sample('title: Bad\nflix: "0.80"\nstatus: error', `## Input\n\n${fence}flix\ndef (\n${fence}\n`));
    assert.equal(f.outputs.length, 0);
});

const rejects = (name, text, message) =>
    test(`rejects: ${name}`, () => assert.throws(() => parseFixture(text, "x.md"), message));

rejects("missing front matter", "## Input\n", /must start with a ---/);
rejects("unclosed front matter", "---\ntitle: a\n", /not closed/);
rejects("unknown key", sample('title: a\nflix: "0.80"\nnonsense: 1', ""), /unknown front matter key "nonsense"/);
rejects("missing title", sample('flix: "0.80"', ""), /non-empty title/);
rejects("unquoted flix version", sample("title: a\nflix: 0.80", ""), /quoted major\.minor/);
rejects("bad status", sample('title: a\nflix: "0.80"\nstatus: maybe', ""), /status must be one of/);
rejects("unknown option", sample('title: a\nflix: "0.80"\noptions: { semi: true }', ""), /unknown option "semi"/);
const withOptions = (value) => sample(`title: a\nflix: "0.80"\noptions: ${value}`, "");
rejects("scalar options", withOptions("42"), /"options" must be a mapping/);
rejects("sequence options", withOptions("[]"), /"options" must be a mapping/);
rejects("empty options", withOptions(""), /"options" must be a mapping/);
rejects("string option value", withOptions('{ printWidth: "80" }'), /option "printWidth" must be a positive integer, found "80"/);
rejects("fractional option value", withOptions("{ tabWidth: 2.5 }"), /positive integer/);
rejects("zero option value", withOptions("{ printWidth: 0 }"), /positive integer/);
rejects("misspelled boolean in options", withOptions("{ useTabs: treu }"), /option "useTabs" must be true or false/);
rejects("untagged block", sample('title: a\nflix: "0.80"', `## Input\n\n${fence}\nx\n${fence}\n`), /tagged "flix"/);
rejects("no input", sample('title: a\nflix: "0.80"', `## Output\n\n${fence}flix\nx\n${fence}\n`), /exactly one Input block, found 0/);
rejects("no output", sample('title: a\nflix: "0.80"', `## Input\n\n${fence}flix\nx\n${fence}\n`), /at least one Output block/);
rejects("unclosed block", sample('title: a\nflix: "0.80"', `## Input\n\n${fence}flix\nx\n`), /not closed/);
rejects("option on first output", sample('title: a\nflix: "0.80"', `## Input\n\n${fence}flix\nx\n${fence}\n## Output\n${fence}flix printWidth=9\nx\n${fence}\n`), /first Output block takes no options/);
rejects("unknown section", sample('title: a\nflix: "0.80"', "## Notes\n"), /unknown section "## Notes"/);

const withInfo = (info) => sample('title: a\nflix: "0.80"', `## Input\n\n${fence}flix\nx\n${fence}\n\n## Output\n\n${fence}flix\nx\n${fence}\n\n${fence}flix ${info}\nx\n${fence}\n`);
rejects("misspelled boolean", withInfo("useTabs=treu"), /option "useTabs" must be true or false, found "treu"/);
rejects("non-numeric width", withInfo("printWidth=abc"), /option "printWidth" must be a positive integer, found "abc"/);
rejects("fractional width", withInfo("tabWidth=2.5"), /positive integer/);
rejects("zero width", withInfo("printWidth=0"), /positive integer/);
rejects("negative width", withInfo("printWidth=-4"), /positive integer/);
rejects("empty value", withInfo("printWidth="), /positive integer, found ""/);
rejects("duplicate option", withInfo("printWidth=30 printWidth=60"), /duplicate option "printWidth"/);
rejects("unknown inline option", withInfo("semi=true"), /unknown option "semi"/);

test("accepts literal booleans and integers inline", () => {
    const f = parseFixture(withInfo("useTabs=true tabWidth=8 printWidth=100"));
    assert.deepEqual(f.outputs[1].options, { useTabs: true, tabWidth: 8, printWidth: 100 });
    assert.deepEqual(parseFixture(withInfo("useTabs=false")).outputs[1].options, { useTabs: false });
});
