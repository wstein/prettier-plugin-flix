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
import { fmt } from "./lib.mjs";

const sample = "def f(): Int32 = 1\n";

test("supported versions list only the current pin", () => {
    assert.deepEqual([...SUPPORTED_FLIX_VERSIONS], ["0.80.0"]);
    assert.equal(DEFAULT_FLIX_VERSION, "0.80.0");
    assert.equal(grammarIdForVersion("0.80.0"), "flix-0.80.0");
});

test("resolveFlixVersion treats omitted values as 0.80.0", () => {
    assert.equal(resolveFlixVersion(undefined), "0.80.0");
    assert.equal(resolveFlixVersion(null), "0.80.0");
    assert.equal(resolveFlixVersion("0.80.0"), "0.80.0");
});

test("resolveFlixVersion rejects unsupported exact versions", () => {
    assert.throws(
        () => resolveFlixVersion("0.79.0"),
        /Unsupported flixVersion "0\.79\.0"\. Supported: 0\.80\.0\./,
    );
    assert.throws(() => resolveFlixVersion("0.80"), /Unsupported flixVersion "0\.80"\. Supported: 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion(""), /Unsupported flixVersion ""\. Supported: 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion("v0.80.0"), /Unsupported flixVersion "v0\.80\.0"\. Supported: 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion("V0.80.0"), /Unsupported flixVersion "V0\.80\.0"\. Supported: 0\.80\.0\./);
    assert.throws(() => resolveFlixVersion(0.8), /flixVersion must be an exact Flix compiler version string/);
});

test("parseFlix and the Prettier parser hand-off accept only supported versions", () => {
    const omitted = parseFlix(sample);
    const explicit = parseFlix(sample, { flixVersion: "0.80.0" });
    assert.equal(omitted.type, "flix-root");
    assert.equal(explicit.type, "flix-root");
    assert.throws(() => parseFlix(sample, { flixVersion: "9.9.9" }), /Unsupported flixVersion "9\.9\.9"/);
    assert.throws(
        () => parsers.flix.parse(sample, { flixVersion: "9.9.9" }),
        /Unsupported flixVersion "9\.9\.9"/,
    );
});

test("Prettier option flixVersion is registered and formats with 0.80.0", async () => {
    assert.equal(options.flixVersion.type, "choice");
    assert.equal(options.flixVersion.default, "0.80.0");
    const withDefault = await fmt(sample);
    const withExplicit = await fmt(sample, { flixVersion: "0.80.0" });
    assert.equal(withDefault, withExplicit);
    assert.equal(withDefault, "def f(): Int32 = 1\n");
});

test("Prettier rejects an unsupported flixVersion choice", async () => {
    await assert.rejects(
        () => format(sample, { parser: "flix", plugins: ["./dist/index.js"], flixVersion: "0.79.0" }),
        /Invalid flixVersion value\. Expected "0\.80\.0", but received "0\.79\.0"/,
    );
});

test("recoverFormatting validates flixVersion like full formatting", async () => {
    const layout = { printWidth: 80, tabWidth: 4, useTabs: false, flixVersion: "0.80.0" };
    assert.equal(await recoverFormatting("def f():Int32=1\n", layout, fmt), "def f(): Int32 = 1\n");
    await assert.rejects(
        () => recoverFormatting("def f():Int32=1\n", { ...layout, flixVersion: "0.79.0" }, fmt),
        /Unsupported flixVersion "0\.79\.0"\. Supported: 0\.80\.0\./,
    );
});
