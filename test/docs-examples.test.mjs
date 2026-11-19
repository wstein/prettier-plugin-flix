import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { approvalFor, auditExample, changeKind } from "../scripts/audit-flix-examples.mjs";
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

test("groups byte differences by their main change", () => {
    assert.equal(changeKind("a\n\nb\n", "a\nb\n"), "blank-lines");
    assert.equal(changeKind("a\n  b\n", "a\n    b\n"), "indentation");
    assert.equal(changeKind("a = 1\r\n", "a = 1\n"), "line-endings");
    assert.equal(changeKind("a   = 1\n", "a = 1\n"), "spacing");
    assert.equal(changeKind("a = 1\n", "a =\n  1\n"), "wrapping");
    assert.equal(changeKind("a = 1\n", "a = 2\n"), "other");
});
