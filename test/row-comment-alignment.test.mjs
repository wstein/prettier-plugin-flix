import assert from "node:assert/strict";
import test from "node:test";
import { hasAdjacentRowComments } from "../dist/comment-layout.js";

const annotation = { text: "// row annotation", isLine: true, isDoc: false, nl: 1 };
const cases = [
    ["Flixdoc", { text: "/// docs", isDoc: true }],
    ["caret marker", { text: "// ^ location" }],
    ["ignore directive", { text: "// prettier-ignore" }],
];

for (const [name, special] of cases) {
    test(`an ordinary row comment followed by ${name} still separates groups`, () => {
        const info = { lead: [annotation, { ...annotation, ...special }], nlAfter: 1 };
        assert.equal(hasAdjacentRowComments(info), false);
    });
}
