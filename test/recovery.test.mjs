import assert from "node:assert/strict";
import test from "node:test";
import { recoverFormatting } from "../dist/index.js";
import { fmt } from "./lib.mjs";

const layout = { printWidth: 80, tabWidth: 4, useTabs: false };
const recover = (text, options = {}, format = fmt) =>
    recoverFormatting(text, { ...layout, ...options }, format);
const lines = (...parts) => parts.join("\n");

test("recovers complete declarations and keeps the damaged source verbatim", async () => {
    const invalid = "def broken():Int32=(,)";
    const source = lines("def first():Int32=1", invalid, "def last():Int32=2", "");
    const result = lines("def first(): Int32 = 1", invalid, "def last(): Int32 = 2", "");
    assert.equal(await recover(source), result);
    assert.equal(await recover(result), undefined);
    await assert.rejects(() => fmt(source), SyntaxError);
});

test("recovers annotated module declarations with tabs and CRLF", async () => {
    const source = [
        "mod Demo {",
        "\tpub def first():Int32=1",
        "\tdef broken():Int32=(,)",
        "\t@Test",
        "\tpub def last():Int32=2",
        "}",
        "",
    ];
    const expected = [...source];
    expected[1] = "\tpub def first(): Int32 = 1";
    expected[4] = "\tpub def last(): Int32 = 2";
    assert.equal(await recover(source.join("\r\n"), { useTabs: true }), expected.join("\r\n"));
});

test("recovers a use with a comment beside the tight package qualifier", async () => {
    const invalid = "def broken():Int32=(,)";
    const source = lines("use Foo  /* keep */::Bar.value", invalid, "def good():Int32=value()", "");
    const expected = lines("use Foo/* keep */::Bar.value", invalid, "def good(): Int32 = value()", "");
    assert.equal(await recover(source), expected);
    assert.equal(await recover(expected), undefined);
});

test("recovers Datalog facts and rules without splitting qualified names", async () => {
    const source = lines(
        "def d() = #{", "    N(Foo.Bar). N(2).", "    P(x) :- .", "    P(x):-N(x).", "}",
    );
    assert.equal(await recover(source), lines(
        "def d() = #{", "    N(Foo.Bar).", "    N(2).", "    P(x) :- .", "    P(x) :- N(x).", "}",
    ));
});

test("recovers enum cases and struct fields around invalid entries", async () => {
    const enumSource = lines("enum E { case A(Int32,String)", "    case B(,)", "    case C(Int32,Bool)", "}");
    assert.equal(await recover(enumSource), enumSource.replace("Int32,Bool", "Int32, Bool"));
    const structSource = lines("struct S {", "    a:Int32,", "    b:,", "    c:Bool", "}");
    assert.equal(await recover(structSource), structSource.replace("a:Int32", "a: Int32").replace("c:Bool", "c: Bool"));
});

for (const flixVersion of ["0.79.0", "0.80.0"]) {
    test(`keeps unclosed comments intact under Flix ${flixVersion}`, async () => {
        const region = lines("/* unclosed", "def outside():Int32=2");
        const source = lines("def first():Int32=1", region);
        assert.equal(await recover(source, { flixVersion }), lines("def first(): Int32 = 1", region));
    });
}

test("keeps truncated modules intact", async () => {
    const region = "mod A {\n    def inside():Int32=(\n";
    assert.equal(await recover(lines("def first():Int32=1", region)), lines("def first(): Int32 = 1", region));
    assert.equal(await recover(""), undefined);
});

test("formats module siblings after a mismatched or unclosed delimiter", async () => {
    const mismatched = lines(
        "mod Demo {",
        "    def first():Int32=1",
        "    def bad():Int32=(]",
        "    def next():Int32=2",
        "}",
        "",
    );
    assert.equal(
        await recover(mismatched),
        lines(
            "mod Demo {",
            "    def first(): Int32 = 1",
            "    def bad():Int32=(]",
            "    def next(): Int32 = 2",
            "}",
            "",
        ),
    );

    const unclosed = lines(
        "mod Demo {",
        "    def first():Int32=1",
        "    def bad():Int32=(",
        "    def next():Int32=2",
        "}",
        "",
    );
    assert.equal(
        await recover(unclosed),
        lines(
            "mod Demo {",
            "    def first(): Int32 = 1",
            "    def bad():Int32=(",
            "    def next(): Int32 = 2",
            "}",
            "",
        ),
    );
});

test("formats Datalog rules around a broken rule with a bad delimiter", async () => {
    const source = lines(
        "def d() = #{",
        "    Path(1,2).",
        "    Broken(.",
        "    Q(3,4).",
        "}",
        "",
    );
    assert.equal(
        await recover(source),
        lines(
            "def d() = #{",
            "    Path(1, 2).",
            "    Broken(.",
            "    Q(3, 4).",
            "}",
            "",
        ),
    );
});

test("leaves a Datalog rule after an unclosed argument list that pairs across the next rule", async () => {
    // Broken(1, pairs with the closer of Q(3,4), so recovery cannot split Q out.
    // R(5,6) after that slice still formats.
    const source = lines(
        "def d() = #{",
        "    A(1,2).",
        "    Broken(1,",
        "    Q(3,4).",
        "    R(5,6).",
        "}",
        "",
    );
    assert.equal(
        await recover(source),
        lines(
            "def d() = #{",
            "    A(1, 2).",
            "    Broken(1,",
            "    Q(3,4).",
            "    R(5, 6).",
            "}",
            "",
        ),
    );
});

test("formats Datalog rules after an unclosed opener that does not pair across them", async () => {
    const source = lines(
        "def d() = #{",
        "    A(1,2).",
        "    Broken(",
        "    Q(3,4).",
        "    R(5,6).",
        "}",
        "",
    );
    assert.equal(
        await recover(source),
        lines(
            "def d() = #{",
            "    A(1, 2).",
            "    Broken(",
            "    Q(3, 4).",
            "    R(5, 6).",
            "}",
            "",
        ),
    );
});

test("formats struct fields after an unclosed opener in a field type", async () => {
    const source = lines(
        "struct S {",
        "    a:Int32,",
        "    bad:(",
        "    c:Bool,",
        "    d:String",
        "}",
        "",
    );
    assert.equal(
        await recover(source),
        lines(
            "struct S {",
            "    a: Int32,",
            "    bad:(",
            "    c: Bool,",
            "    d: String",
            "}",
            "",
        ),
    );
});

test("rejects a nonconforming recovery wrapper and propagates unexpected formatter errors", async () => {
    const source = lines("mod Demo {", "    def first():Int32=1", "    def broken():Int32=(,)", "}");
    for (const wrapper of [
        "unexpected\n",
        "mod Recovery {\n    def first(): Int32 = 1\n",
        "mod Recovery {\ndef first(): Int32 = 1\n}\n",
    ]) {
        const format = (text, options) => text.startsWith("mod Recovery") ? wrapper : fmt(text, options);
        assert.equal(await recover(source, {}, format), undefined);
    }
    await assert.rejects(() => recover(source, {}, () => { throw new Error("formatter failure"); }), /formatter failure/);
});
