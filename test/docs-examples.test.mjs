import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { explainTrailingCommentAlignment } from "../dist/comment-layout.js";
import {
    approvalFor, auditExample, changeKind, compareBaseline, docsExamplesArgsError, unreviewedLayouts,
    withMissingReviews,
} from "../scripts/audit-flix-examples.mjs";
import { renderFindings, reviewedTransformations } from "../scripts/docs-example-findings.mjs";
import { extractExamples, markdownBlocks } from "../scripts/extract-flix-examples.mjs";

const exec = promisify(execFile);

test("extracts actual Flix and Java fences with their heading, indentation and location", () => {
    const text = [
        "# First", "````text", "# Not a heading", "```flix", "ignored", "```", "````",
        "  ~~~flix", "  def f(): Int32 =", "      1", "  ~~~",
        "## Interop", "```java", "class Example {}", "```",
    ].join("\n");
    assert.deepEqual(markdownBlocks(text, "Fallback"), [
        { heading: "First", language: "flix", line: 9, code: "def f(): Int32 =\n    1\n" },
        { heading: "Interop", language: "java", line: 14, code: "class Example {}\n" },
    ]);
});

test("inventories Markdown, exported JS templates and inline Astro templates without running them", async (t) => {
    const dir = await mkdtemp(join(tmpdir(), "flix-docs-test-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const book = join(dir, "book");
    const website = join(dir, "website");
    const sources = [
        [book, "src/SUMMARY.md", "- [Getting Started](./intro.md)\n  - [Hello](./nested/hello.md)"],
        [book, "src/nested/hello.md", "# Héllo\n```flix\n1\n```\n```flix\n2\n```"],
        [website, "src/lib/indexExamples.js",
            'throw new Error("must never run");\nexport const testExample = `def f(): String = "\\${n}\\\\n"`;\n' +
            'export const testOutput = `This is plain output.`;'],
        [website, "src/pages/index.astro", '<Feature code={testExample} /><PlainSnippet code={testOutput} />'],
        [website, "src/pages/get-started.astro", "---\nconst localExample = `def g(): Int32 = 42`;\n---\n<CodeSnippet code={localExample} />"],
    ];
    for (const [root, file, source] of sources) {
        const path = join(root, file);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, source);
    }
    for (const root of [book, website]) {
        await exec("git", ["init", "-q", root]);
        await exec("git", ["-C", root, "add", "."]);
        await exec("git", ["-C", root, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Test source"]);
    }
    const { examples } = await extractExamples(book, website);
    assert.deepEqual(examples.map((item) => item.case_name), [
        "book.getting-started.hello.hello", "book.getting-started.hello.hello-02",
        "website.get-started.local.local-example", "website.front-page.test.test-example",
    ]);
    assert.equal(examples[3].code, 'def f(): String = "${n}\\n"');
    assert.match(examples[3].url, /\/blob\/[0-9a-f]+\/src\/lib\/indexExamples\.js#L2$/);
});

test("audits programs and fragments, with approvals tied to the exact change", async () => {
    const input = { code: "def f():Int32=1", language: "flix" };
    const result = await auditExample(input);
    assert.equal(result.status, "layout-change");
    assert.equal(result.formatted, "def f(): Int32 = 1\n");
    const approval = { digest: result.digest, reason: "Consistent spacing around annotations and assignments." };
    assert.equal(approvalFor(result, approval), approval.reason);
    assert.equal(approvalFor(result, { ...approval, reason: " " }), undefined);
    assert.equal(approvalFor(await auditExample({ ...input, code: "def f():Int32=2" }), approval), undefined);
    const fragment = await auditExample({ ...input, code: "1+2" });
    assert.equal(fragment.context, "expression-or-statements");
    assert.equal(fragment.status, "layout-change");
    assert.equal(fragment.input, "1+2");
    assert.equal(fragment.formatted, "1 + 2\n");
    assert.equal((await auditExample({ ...input, code: "def f(): Int32 = 1" })).changeKind, "line-endings");
    assert.equal((await auditExample({ ...input, code: "def missing(): Int32 = ..." })).status, "needs-context");
    assert.equal((await auditExample({ ...input, language: "java" })).status, "other-language");
});

test("shows reviewed transformations only for the recorded case and diff", async () => {
    const caseName = "book.data-types.tuples.tuples-04";
    const source = [
        "let l = (1, 1) :: (2, 2) :: Nil; // has type List[(Int32, Int32)]",
        "List.map(fst, l)                 // has type List[Int32]",
        "",
    ].join("\n");
    const result = await auditExample({ code: source, language: "flix" });
    const item = { ...result, case_name: caseName, url: "https://example.invalid" };
    assert.deepEqual(result.explanation, {
        type: "align-trailing-comments",
        changes: [
            { line: 1, beforeColumns: 1, afterColumns: 2 },
            { line: 2, beforeColumns: 17, afterColumns: 18 },
        ],
    });
    const diff = `diff --git a/before/${caseName}.flix b/after/${caseName}.flix\n@@ -1 +1 @@\n-a\n+b\n`;
    const findings = renderFindings([{ ...item, hasDiff: true }], diff);
    assert.match(findings.html, /<h2>Automatically explained \(1\)<\/h2>/);
    assert.match(findings.markdown, /Line 2 · 17 → 18 columns before \/\//);
    assert.equal((await auditExample({ code: source.trimEnd(), language: "flix" })).explanation, undefined);
    assert.equal((await auditExample({ code: source.replace("let l =", "let l="), language: "flix" })).explanation, undefined);
    assert.deepEqual(reviewedTransformations(item), [
        { type: "align-trailing-comments", scope: "Type comments on the list binding and List.map" },
    ]);
    const revised = await auditExample({ code: source.replace("has type", "yields"), language: "flix" });
    assert.equal(reviewedTransformations({ ...revised, case_name: caseName }), undefined);
    const { html, markdown } = renderFindings([item], "");
    assert.match(html, /<code>align-trailing-comments<[/]code>/);
    assert.match(markdown, /- `align-trailing-comments`/);
});

test("comment alignment explanations require a fitting group of actual comments", () => {
    const settings = { printWidth: 80, tabWidth: 4, useTabs: false };
    const original = 'def a(): String = "// inside a string" // first\n' +
        'def longer(): String = "value" // second\n';
    const changedString = original.replace("// inside", "//  inside");
    assert.equal(explainTrailingCommentAlignment(original, changedString, settings), undefined);

    const code = 'def a(): Int32 = 1 // First\ndef longer(): Int32 = 2 // Second\n';
    const aligned = 'def a(): Int32 = 1       // First\ndef longer(): Int32 = 2  // Second\n';
    assert.equal(explainTrailingCommentAlignment(code, aligned, { ...settings, printWidth: 25 }), undefined);
    assert.equal(explainTrailingCommentAlignment(
        code.replace("First\n", "First\n\n"), aligned.replace("First\n", "First\n\n"), settings,
    ), undefined);
});

test("groups byte differences by their main change", () => {
    assert.equal(changeKind("a\n\nb\n", "a\nb\n"), "blank-lines");
    assert.equal(changeKind("a\n  b\n", "a\n    b\n"), "indentation");
    assert.equal(changeKind("a = 1\r\n", "a = 1\n"), "line-endings");
    assert.equal(changeKind("a   = 1\n", "a = 1\n"), "spacing");
    assert.equal(changeKind("a = 1\n", "a =\n  1\n"), "wrapping");
    assert.equal(changeKind("a = 1\n", "a = 2\n"), "other");
});

test("ignores trailing whitespace without dropping a substantive layout change", async () => {
    const audit = (code) => auditExample({ language: "flix", code });
    const trailing = await audit("def f(): Int32 = 1  \t\n");
    assert.equal(trailing.status, "unchanged");
    const mixed = await audit("def f():Int32=1  \t\n");
    const clean = await audit("def f():Int32=1\n");
    assert.equal(mixed.input, clean.input);
    assert.equal(mixed.digest, clean.digest);
    assert.equal(mixed.changeKind, "spacing");
});

test("detects additions, deletions and changes beyond the recorded baseline", () => {
    const header = "case\tstatus\tchange\tsha256\n";
    const row = (name, byte) => `${name}\tunchanged\t-\t${byte.repeat(64)}\n`;
    const previous = header + row("book.same", "a") + row("book.changed", "b") + row("book.removed", "c");
    const current = header + row("book.same", "a") + row("book.changed", "d") + row("website.new", "e");
    assert.deepEqual(compareBaseline(previous, previous), { added: [], removed: [], changed: [] });
    assert.deepEqual(compareBaseline(previous, current), {
        added: ["website.new"], removed: ["book.removed"], changed: ["book.changed"],
    });
    assert.throws(() => compareBaseline(previous, current + row("book.same", "a")), /Invalid official example baseline row/);
});

test("shows inline diffs and escapes source code in the HTML overview", () => {
    const name = "book.general.example.test";
    const diff = `diff --git a/before/${name}.flix b/after/${name}.flix\n@@ -1 +1 @@\n-<script>\n+    <script>\n`;
    const item = { case_name: name, hasDiff: true, changeKind: "indentation", url: "https://example.invalid" };
    const { html, markdown } = renderFindings([item], diff);
    assert.match(html, /<span class="removed">-&lt;script&gt;<\/span>/);
    assert.match(html, /<summary>book\.general\.example\.test<\/summary>/);
    assert.match(markdown, /@@ -1 \+1 @@\n-<script>\n\+    <script>/);
});


test("pull request audit requires reasons only for added or changed layout diffs", () => {
    const cases = [
        { case_name: "old", status: "layout-change" },
        { case_name: "new", status: "layout-change" },
        { case_name: "changed", status: "layout-change" },
        { case_name: "approved", status: "layout-change", approval: "Keeps the import group together." },
        { case_name: "clean", status: "unchanged" },
    ];
    const drift = { added: ["new", "clean"], changed: ["changed", "approved"], removed: ["gone"] };
    assert.deepEqual(unreviewedLayouts(cases, drift).map((item) => item.case_name), ["new", "changed"]);
    assert.deepEqual(unreviewedLayouts(cases).map((item) => item.case_name), ["old", "new", "changed"]);
    assert.equal(withMissingReviews(false, unreviewedLayouts(cases, drift)), true);
    assert.equal(withMissingReviews(false, []), false);
    assert.equal(withMissingReviews(true, []), true);
});

test("docs-examples CLI requires three paths and pairs --review-baseline with --reviews", () => {
    assert.equal(docsExamplesArgsError(["a", "b", "c"], {}), undefined);
    assert.match(docsExamplesArgsError(["a", "b"], {}), /Usage:/);
    assert.match(docsExamplesArgsError(["a", "b", "c"], { "review-baseline": "base.tsv" }), /Usage:/);
    assert.equal(docsExamplesArgsError(["a", "b", "c"], { reviews: "r.json", "review-baseline": "base.tsv" }), undefined);
});
