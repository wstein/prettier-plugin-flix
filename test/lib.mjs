import { format } from "prettier";
import { CharStream, CommonTokenStream } from "antlr4ng";
import { FlixLexer } from "../dist/generated/flix-0.80.0/FlixLexer.js";
import { FlixParser } from "../dist/generated/flix-0.80.0/FlixParser.js";
import plugin from "../dist/index.js";
import { findStringContinuationError } from "../dist/parse.js";

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
    const continuation = findStringContinuationError(stream.getTokens(), FlixLexer);
    if (continuation) {
        const { line, column } = continuation.loc.start;
        errors.unshift(`${line}:${column - 1} ${continuation.message}`);
    }
    const tokens = stream.getTokens().filter((t) => t.channel === 0 && t.type !== FlixLexer.EOF).map((t) => t.text);
    const comments = stream.getTokens().filter((t) => t.channel >= 2).map((t) => t.text.trim());
    const shape = (n) => (n.children ? `${n.constructor.name}(${n.children.map(shape).join(",")})` : "t");
    const constraintEnds = new Map();
    const consOps = new Set();
    const walk = (n) => {
        if (n.constructor.name === "DatalogConstraintContext") {
            const { symbol } = n.children[n.children.length - 1];
            constraintEnds.set(symbol.tokenIndex, FlixLexer.symbolicNames[symbol.type]);
        }
        if (n.constructor.name === "ConsExprContext" || n.constructor.name === "ConsPatternContext") {
            for (const child of n.children ?? []) {
                const type = child.symbol?.type;
                if (type === FlixLexer.COLON_COLON || type === FlixLexer.COLON_COLON_TIGHT) {
                    consOps.add(child.symbol.tokenIndex);
                }
            }
        }
        (n.children ?? []).forEach(walk);
    };
    walk(tree);
    const classified = new Set([FlixLexer.ARROW_TIGHT, FlixLexer.ARROW_WS, FlixLexer.DOT, FlixLexer.DOT_WS, FlixLexer.FREE_DOT, FlixLexer.COLON_COLON, FlixLexer.COLON_COLON_TIGHT]);
    const sensitive = stream.getTokens().filter((t) => classified.has(t.type));
    const classes = sensitive.map((t) => FlixLexer.symbolicNames[t.type]);
    // Only parsed Datalog terminators may be normalized from DOT to DOT_WS.
    // Cons `::` in expressions and patterns may loosen ColonColonTight to ColonColon;
    // `use` path qualifiers must keep their exact class.
    const programClasses = sensitive.map((t, i) => {
        if (constraintEnds.has(t.tokenIndex)) return "DatalogTerminator";
        if (consOps.has(t.tokenIndex)) return "ConsColonColon";
        return classes[i];
    });
    return { errors, tokens, comments, classes, programClasses, constraintEnds: [...constraintEnds.values()], shape: shape(tree) };
}

/** Optional trailing commas may legitimately vanish when a list fits on one line. */
export const dropTrailingCommas = (tokens) =>
    tokens.filter((t, i) => !(t === "," && [")", "]", "}"].includes(tokens[i + 1])));

/**
 * Everything a formatter must preserve, as a list of problems (empty when the program is intact):
 * the output parses, has the same tokens (optional trailing commas aside), comments, parse-tree
 * shape and whitespace-sensitive token classes. For formatter output, Datalog terminators must
 * be DOT_WS. With `terminators: false`, compare those token classes as written as well.
 */
export function programProblems(before, after, { terminators = true } = {}) {
    if (after.errors.length > 0) return [`output does not parse: ${after.errors[0]}`];
    const problems = [];
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (!same(dropTrailingCommas(before.tokens), dropTrailingCommas(after.tokens))) problems.push("tokens differ");
    if (!same(before.comments, after.comments)) problems.push("comments differ");
    if (before.shape !== after.shape) problems.push("parse-tree shape differs");
    const classKey = terminators ? "programClasses" : "classes";
    if (!same(before[classKey], after[classKey])) problems.push("whitespace-sensitive token classes differ");
    // Cons chains may loosen ColonColonTight to ColonColon, never the reverse (#176).
    if (before.classes.length === after.classes.length) {
        for (let i = 0; i < before.classes.length; i++) {
            if (before.classes[i] === "COLON_COLON" && after.classes[i] === "COLON_COLON_TIGHT") {
                problems.push("cons :: tightened from spaced to tight");
                break;
            }
        }
    }
    // Only formatter output must satisfy this: an input may legitimately end a constraint with a bare dot.
    if (terminators && !after.constraintEnds.every((t) => t === "DOT_WS")) problems.push(`Datalog constraint not ended by a dot followed by whitespace (${after.constraintEnds})`);
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

/** Tokens a comment is glued to: a space after a tight `.` or `::` would change the token class. */
const TIGHT_TYPES = new Set([FlixLexer.DOT, FlixLexer.COLON_COLON_TIGHT]);

/**
 * A comment site is a default-channel token outside a string. Tight dots and double colons
 * use a glued comment to exercise their original token classes.
 */
export function commentSites(text) {
    const lexer = new FlixLexer(CharStream.fromString(text));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    stream.fill();
    const stringTypes = new Set([FlixLexer.STRING_START, FlixLexer.STRING_END, FlixLexer.STRING_CONTENT, FlixLexer.INTERPOLATION_START, FlixLexer.INTERPOLATION_END, FlixLexer.DEBUG_INTERPOLATOR]);
    const sites = [];
    let depth = 0;
    for (const t of stream.getTokens()) {
        if (t.channel !== 0 || t.type === FlixLexer.EOF) continue;
        if (t.type === FlixLexer.STRING_START) depth++;
        const inString = depth > 0 || stringTypes.has(t.type);
        if (!inString) sites.push({ tokenIndex: t.tokenIndex, glued: TIGHT_TYPES.has(t.type) });
        if (t.type === FlixLexer.STRING_END) depth--;
    }
    return sites;
}

/** Insert a line or block comment after the selected token; tight dots and :: glue it. */
export function withLineCommentAfter(text, { tokenIndex, glued, style = "line" }) {
    const lexer = new FlixLexer(CharStream.fromString(text));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    stream.fill();
    const comment = style === "block"
        ? (glued ? "/* note */" : " /* note */ ")
        : (glued ? "// note\n" : " // note\n");
    let out = "";
    for (const t of stream.getTokens()) {
        if (t.type === FlixLexer.EOF) break;
        out += t.text;
        if (t.tokenIndex === tokenIndex) out += comment;
    }
    return out;
}

/** Where a comment can go and how it is written: after a token, as a line comment, a block comment, or on its own line before it. */
export const COMMENT_FORMS = ["line", "block", "own"];

/** The comment text each form inserts, as it appears in the source. */
export const COMMENT_MARKERS = { line: "// note", block: "/* note */", own: "// own" };

/**
 * `text` with a comment of the given form at the token `tokenIndex`:
 * - `line`: `// note` and a line break after the token (glued to a tight `.` or `::`),
 * - `block`: `/* note *\/` after the token (glued the same way, else surrounded by spaces),
 * - `own`: `// own` on its own line before the token.
 */
export function withCommentAt(text, tokenIndex, form) {
    if (!COMMENT_FORMS.includes(form)) throw new Error(`unknown comment form ${form}`);
    const lexer = new FlixLexer(CharStream.fromString(text));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    stream.fill();
    let out = "";
    for (const t of stream.getTokens()) {
        if (t.type === FlixLexer.EOF) break;
        if (form === "own" && t.tokenIndex === tokenIndex) out += "\n// own\n";
        out += t.text;
        if (t.tokenIndex === tokenIndex) {
            const glued = TIGHT_TYPES.has(t.type);
            if (form === "line") out += glued ? "// note\n" : " // note\n";
            if (form === "block") out += glued ? "/* note */" : " /* note */ ";
        }
    }
    return out;
}
