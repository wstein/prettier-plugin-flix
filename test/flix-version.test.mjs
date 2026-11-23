import assert from "node:assert/strict";
import test from "node:test";
import { format } from "prettier";
import {
    DEFAULT_FLIX_VERSION,
    SUPPORTED_FLIX_VERSIONS,
    grammarIdForVersion,
    options,
    parsers,
    recoverFormatting,
    resolveFlixVersion,
} from "../dist/index.js";
import { parseFlix } from "../dist/parse.js";
import { fingerprint, fmt, programProblems } from "./lib.mjs";

const sample = "def f(): Int32 = 1\n";
const moduleVal = "val n: Int32 = 1\n";
const reservedValName = "def val(): Int32 = 42\n";

test("supported versions list 0.79.0 and 0.80.0", () => {
    assert.deepEqual([...SUPPORTED_FLIX_VERSIONS], ["0.79.0", "0.80.0"]);
    assert.equal(DEFAULT_FLIX_VERSION, "0.80.0");
    assert.equal(grammarIdForVersion("0.79.0"), "flix-0.79.0");
    assert.equal(grammarIdForVersion("0.80.0"), "flix-0.80.0");
});

test("resolveFlixVersion treats omitted values as 0.80.0", () => {
    assert.equal(resolveFlixVersion(undefined), "0.80.0");
    assert.equal(resolveFlixVersion(null), "0.80.0");
    assert.equal(resolveFlixVersion("0.80.0"), "0.80.0");
    assert.equal(resolveFlixVersion("0.79.0"), "0.79.0");
});

test("resolveFlixVersion rejects unsupported exact versions", () => {
    assert.throws(() => resolveFlixVersion("0.78.0"), /Unsupported flixVersion "0\.78\.0"\. Supported: 0\.79\.0, 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion("0.80"), /Unsupported flixVersion "0\.80"\. Supported: 0\.79\.0, 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion(""), /Unsupported flixVersion ""\. Supported: 0\.79\.0, 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion("v0.80.0"), /Unsupported flixVersion "v0\.80\.0"\. Supported: 0\.79\.0, 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion("V0.80.0"), /Unsupported flixVersion "V0\.80\.0"\. Supported: 0\.79\.0, 0\.80\.0\./);
    assert.throws(
        () => resolveFlixVersion(" 0.80.0 "),
        /Unsupported flixVersion " 0\.80\.0 "\. Supported: 0\.79\.0, 0\.80\.0\./,
    );
    assert.throws(
        () => resolveFlixVersion(0.8),
        /flixVersion must be an exact Flix compiler version string \(supported: 0\.79\.0, 0\.80\.0\)\./,
    );
});

test("parseFlix and the Prettier parser hand-off accept both supported versions", () => {
    const omitted = parseFlix(sample);
    const v80 = parseFlix(sample, { flixVersion: "0.80.0" });
    const v79 = parseFlix(sample, { flixVersion: "0.79.0" });
    assert.equal(omitted.type, "flix-root");
    assert.equal(omitted.grammarId, "flix-0.80.0");
    assert.equal(omitted.flixVersion, "0.80.0");
    assert.equal(v80.grammarId, "flix-0.80.0");
    assert.equal(v79.grammarId, "flix-0.79.0");
    assert.equal(v79.flixVersion, "0.79.0");
    assert.throws(() => parseFlix(sample, { flixVersion: "9.9.9" }), /Unsupported flixVersion "9\.9\.9"/);
    assert.throws(
        () => parsers.flix.parse(sample, { flixVersion: "9.9.9" }),
        /Unsupported flixVersion "9\.9\.9"/,
    );
});

test("module-level val is Decl.Val under 0.80.0 and rejected under 0.79.0", () => {
    const root80 = parseFlix(moduleVal, { flixVersion: "0.80.0" });
    const shape = (n) => (n.children ? `${n.constructor.name}(${n.children.map(shape).join(",")})` : "t");
    assert.match(shape(root80.tree), /ValDeclarationContext/);
    assert.throws(
        () => parseFlix(moduleVal, { flixVersion: "0.79.0" }),
        (err) => err instanceof SyntaxError,
    );
});

test("def val is rejected under 0.80.0 because val is reserved", () => {
    assert.throws(
        () => parseFlix(reservedValName, { flixVersion: "0.80.0" }),
        (err) => err instanceof SyntaxError,
    );
    // Under 0.79, `val` is an ordinary lowercase name and the definition parses.
    const root79 = parseFlix(reservedValName, { flixVersion: "0.79.0" });
    assert.equal(root79.type, "flix-root");
    assert.match(
        (function shape(n) {
            return n.children ? `${n.constructor.name}(${n.children.map(shape).join(",")})` : "t";
        })(root79.tree),
        /DefDeclarationContext/,
    );
});

test("Prettier option flixVersion formats with both pins", async () => {
    assert.equal(options.flixVersion.type, "choice");
    assert.equal(options.flixVersion.default, "0.80.0");
    assert.deepEqual(
        options.flixVersion.choices.map((c) => c.value),
        ["0.79.0", "0.80.0"],
    );
    const withDefault = await fmt(sample);
    const with80 = await fmt(sample, { flixVersion: "0.80.0" });
    const with79 = await fmt(sample, { flixVersion: "0.79.0" });
    assert.equal(withDefault, with80);
    assert.equal(withDefault, "def f(): Int32 = 1\n");
    assert.equal(with79, "def f(): Int32 = 1\n");
    assert.equal(await fmt(moduleVal, { flixVersion: "0.80.0" }), "val n: Int32 = 1\n");
});

test("Prettier rejects an unsupported flixVersion choice", async () => {
    // Prettier may color choice names in CI; strip ANSI before matching.
    await assert.rejects(
        () => format(sample, { parser: "flix", plugins: ["./dist/index.js"], flixVersion: "0.78.0" }),
        (err) => {
            const message = String(err?.message ?? err).replace(/\u001b\[[0-9;]*m/g, "");
            return /Invalid flixVersion value\. Expected one of the following values, but received "0\.78\.0"/.test(message)
                || /Invalid flixVersion value\. Expected "0\.79\.0" or "0\.80\.0", but received "0\.78\.0"/.test(message);
        },
    );
});

test("Flix 0.80 rejects uppercase definitions and malformed literals", () => {
    for (const source of [
        "def Upper(): Int32 = 1",
        "def f(): Int32 = 12bad",
        'def f(): Regex = regex"tail\\',
    ]) {
        assert.throws(() => parseFlix(source, { flixVersion: "0.80.0" }), SyntaxError);
    }
    assert.doesNotThrow(() => parseFlix("def Upper(): Int32 = 1", { flixVersion: "0.79.0" }));
});

test("recoverFormatting validates flixVersion and uses the selected grammar", async () => {
    const layout80 = { printWidth: 80, tabWidth: 4, useTabs: false, flixVersion: "0.80.0" };
    const layout79 = { printWidth: 80, tabWidth: 4, useTabs: false, flixVersion: "0.79.0" };
    assert.equal(await recoverFormatting("def f():Int32=1\n", layout80, fmt), "def f(): Int32 = 1\n");
    assert.equal(await recoverFormatting("def f():Int32=1\n", layout79, fmt), "def f(): Int32 = 1\n");
    // A broken span is left verbatim; a later complete def still formats under 0.79.
    const partial79 = "def ok(): Int32 = 1\n@@@\ndef later():Int32=2\n";
    const recovered79 = await recoverFormatting(partial79, layout79, (source) => fmt(source, { flixVersion: "0.79.0" }));
    assert.match(recovered79 ?? "", /def ok\(\): Int32 = 1/);
    assert.match(recovered79 ?? "", /@@@/);
    assert.match(recovered79 ?? "", /def later\(\): Int32 = 2/);
    await assert.rejects(
        () => recoverFormatting("def f():Int32=1\n", { ...layout80, flixVersion: "0.78.0" }, fmt),
        /Unsupported flixVersion "0\.78\.0"\. Supported: 0\.79\.0, 0\.80\.0\./,
    );
});

test("fingerprint preserves tokens and tree shape under flixVersion 0.79.0", async () => {
    const source = "def val(): Int32 = 1 + 2\n";
    const formatted = await fmt(source, { flixVersion: "0.79.0" });
    assert.equal(formatted, "def val(): Int32 = 1 + 2\n");
    const before = fingerprint(source, "0.79.0");
    const after = fingerprint(formatted, "0.79.0");
    assert.deepEqual(before.errors, []);
    assert.deepEqual(programProblems(before, after), []);
    // Default fingerprint uses 0.80 and rejects `val` as a name.
    assert.notEqual(fingerprint(source).errors.length, 0);
});
