import test from "node:test";
import assert from "node:assert/strict";
import { extractFlixBlocks } from "../scripts/snippets.mjs";

const fence = "```";

test("takes flix, scala and untagged blocks, skips other languages", () => {
    const md = [
        "Text", `${fence}flix`, "def a(): Int32 = 1", fence, "",
        `${fence}scala`, "def b(): Int32 = 2", fence, "",
        fence, "def c(): Int32 = 3", fence, "",
        `${fence}bash`, "java -jar flix.jar", fence, "",
        `${fence}json`, "{}", fence,
    ].join("\n");
    assert.deepEqual(extractFlixBlocks(md).map((b) => [b.lang, b.code]), [
        ["flix", "def a(): Int32 = 1"],
        ["scala", "def b(): Int32 = 2"],
        ["", "def c(): Int32 = 3"],
    ]);
});

test("handles longer fences, tildes, CRLF and info strings", () => {
    const md = ["````flix title=x", `${fence}`, "inner", fence, "````", "", "~~~flix", "def d(): Int32 = 4", "~~~"].join("\r\n");
    const blocks = extractFlixBlocks(md);
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].code, `${fence}\ninner\n${fence}`);
    assert.equal(blocks[1].code, "def d(): Int32 = 4");
});

test("ignores empty and unclosed blocks and reports the opening line", () => {
    assert.deepEqual(extractFlixBlocks(`${fence}flix\n${fence}`), []);
    assert.deepEqual(extractFlixBlocks(`${fence}flix\ndef e(): Int32 = 5`), []);
    assert.equal(extractFlixBlocks(`a\nb\n${fence}flix\nx\n${fence}`)[0].line, 3);
});
