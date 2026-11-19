import { format } from "prettier";
import { CharStream, CommonTokenStream } from "antlr4ng";
import { FlixLexer } from "../dist/generated/FlixLexer.js";
import { FlixParser } from "../dist/generated/FlixParser.js";
import plugin from "../dist/index.js";

export const fmt = (text, opts = {}) =>
    format(text, { parser: "flix", plugins: [plugin], ...opts });

/** Default-channel token texts plus a parse-tree shape string. */
export function fingerprint(text) {
    const lexer = new FlixLexer(CharStream.fromString(text));
    const stream = new CommonTokenStream(lexer);
    const parser = new FlixParser(stream);
    const errors = [];
    const l = { syntaxError: (_r, _s, line, col, msg) => errors.push(`${line}:${col} ${msg}`), reportAmbiguity() {}, reportAttemptingFullContext() {}, reportContextSensitivity() {} };
    lexer.removeErrorListeners(); lexer.addErrorListener(l);
    parser.removeErrorListeners(); parser.addErrorListener(l);
    const tree = parser.compilationUnit();
    stream.fill();
    const tokens = stream.getTokens().filter((t) => t.channel === 0 && t.type !== FlixLexer.EOF).map((t) => t.text);
    const comments = stream.getTokens().filter((t) => t.channel >= 2).map((t) => t.text.trim());
    const shape = (n) => (n.children ? `${n.constructor.name}(${n.children.map(shape).join(",")})` : "t");
    // Flix reads `a->b` (field access) and `a -> b` (arrow) differently, and a Datalog constraint
    // ends only at a dot followed by whitespace; the token text alone does not show a change.
    const arrows = stream.getTokens().filter((t) => t.type === FlixLexer.ARROW_TIGHT || t.type === FlixLexer.ARROW_WS).map((t) => FlixLexer.symbolicNames[t.type]);
    const constraintEnds = [];
    const walk = (n) => {
        if (n.constructor.name === "DatalogConstraintContext") {
            const last = n.children[n.children.length - 1];
            constraintEnds.push(FlixLexer.symbolicNames[last.symbol.type]);
        }
        (n.children ?? []).forEach(walk);
    };
    walk(tree);
    return { errors, tokens, comments, arrows, constraintEnds, shape: shape(tree) };
}

/** Optional trailing commas may legitimately vanish when a list fits on one line. */
export const dropTrailingCommas = (tokens) =>
    tokens.filter((t, i) => !(t === "," && [")", "]", "}"].includes(tokens[i + 1])));

/**
 * Everything a formatter must preserve, as a list of problems (empty when the program is intact):
 * the output parses, has the same tokens (optional trailing commas aside), comments, parse-tree
 * shape and arrow token classes, and every Datalog constraint ends in a dot followed by whitespace.
 */
export function programProblems(before, after) {
    if (after.errors.length > 0) return [`output does not parse: ${after.errors[0]}`];
    const problems = [];
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (!same(dropTrailingCommas(before.tokens), dropTrailingCommas(after.tokens))) problems.push("tokens differ");
    if (!same(before.comments, after.comments)) problems.push("comments differ");
    if (before.shape !== after.shape) problems.push("parse-tree shape differs");
    if (!same(before.arrows, after.arrows)) problems.push("arrow token classes differ");
    if (!after.constraintEnds.every((t) => t === "DOT_WS")) problems.push(`Datalog constraint not ended by a dot followed by whitespace (${after.constraintEnds})`);
    return problems;
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Rewrites every whitespace run of `text` with a random choice (a space, several spaces, a line
 * break, a blank line, an indented line), keeping the program the same: no whitespace appears where
 * there was none, so tight tokens (`a->b`, `Foo::Bar`) stay tight, and a run after a `//` comment
 * keeps a line break. Reproducible for a given seed.
 */
export function perturbWhitespace(text, seed) {
    const lexer = new FlixLexer(CharStream.fromString(text));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    stream.fill();
    const rand = mulberry32(seed);
    const choices = [" ", "  ", "\n", "\n\n", "\n    ", " \n ", "\t"];
    let out = "";
    let previous = null;
    for (const t of stream.getTokens()) {
        if (t.type === FlixLexer.EOF) break;
        if (t.type === FlixLexer.WS) {
            const afterLineComment = previous && (previous.type === FlixLexer.LINE_COMMENT || previous.type === FlixLexer.DOC_COMMENT);
            let pick = choices[Math.floor(rand() * choices.length)];
            if (afterLineComment && !pick.includes("\n")) pick = "\n";
            out += pick;
        } else {
            out += t.text;
        }
        previous = t;
    }
    return out;
}
