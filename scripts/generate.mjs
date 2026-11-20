#!/usr/bin/env node
/**
 * Generate the antlr-ng (TypeScript) target from the shared grammars.
 *
 * The pinned @wstein/flix-antlr-grammar package provides the canonical grammars.
 * Their embedded actions use Java syntax, and antlr-ng's TypeScript target
 * ignores `options { superClass }`. Adapt the generated copy:
 *
 *   1. Pre-process a TypeScript-flavored copy of the grammars into build/.
 *   2. Run antlr-ng over the copy.
 *   3. Patch the generated lexer to extend FlixLexerBase.
 *
 * Run via `npm run generate`.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");
const root = pkg;
// The grammar comes from the pinned @wstein/flix-antlr-grammar dependency, never from a copy.
const grammarPkg = join(root, "node_modules", "@wstein", "flix-antlr-grammar");
const src = join(grammarPkg, "grammars");
const staged = join(pkg, "build", "grammar");
const out = join(pkg, "src", "generated");

/** Helpers defined on FlixLexerBase; unqualified in Java, `this.`-qualified in TypeScript. */
const HELPERS = [
    "isNameCharFollow", "classifyColonColon", "classifyArrow", "classifyDot", "classifyOperator",
    "enterBrace", "exitBrace", "openInterpolation", "stripEscape", "popMode",
];

function toTypeScript(grammar) {
    let s = grammar;
    for (const h of HELPERS) {
        s = s.replaceAll(new RegExp(`(?<![.\\w])${h}\\(`, "g"), `this.${h}(`);
    }
    // antlr4ng exposes the token type as a property and the stream under a different name.
    s = s.replaceAll(/setType\((\w+)\)/g, "this.type = FlixLexer.$1");
    s = s.replaceAll(/(?<![.\w])_input\./g, "this.inputStream.");
    // A Java char literal is a number; in TypeScript it would be a string, so compare
    // against the code point instead.
    s = s.replaceAll(/(LA\(-?\d+\)\s*)===?\s*'(.)'/g, (_, la, ch) => `${la}=== 0x${ch.codePointAt(0).toString(16)}`);
    return s;
}

mkdirSync(staged, { recursive: true });
copyFileSync(join(grammarPkg, "antlr-ng", "src", "FlixLexerBase.ts"), join(pkg, "src", "FlixLexerBase.ts"));
for (const file of readdirSync(src).filter((f) => f.endsWith(".g4"))) {
    writeFileSync(join(staged, file), toTypeScript(readFileSync(join(src, file), "utf8")));
}

execFileSync(
    "npx",
    ["antlr-ng", "-o", out, "-D", "language=TypeScript", "--generate-visitor",
        "--generate-listener", "false", join(staged, "FlixLexer.g4"), join(staged, "FlixParser.g4")],
    { cwd: pkg, stdio: "inherit" },
);

// antlr-ng honors `options { superClass }` in the class declaration but never emits
// an import for it, so the base class is unresolved. Supply the import (and re-parent
// defensively, in case a future version drops the superClass handling).
const lexerFile = join(out, "FlixLexer.ts");
let lexer = readFileSync(lexerFile, "utf8");
if (!lexer.includes('from "../FlixLexerBase.js"')) {
    const lines = lexer.split("\n");
    const lastImport = lines.reduce((acc, l, i) => (l.startsWith("import ") ? i : acc), -1);
    lines.splice(lastImport + 1, 0, `import { FlixLexerBase } from "../FlixLexerBase.js";`);
    lexer = lines.join("\n").replace(
        /export class FlixLexer extends \w+ \{/,
        "export class FlixLexer extends FlixLexerBase {",
    );
    writeFileSync(lexerFile, lexer);
}
console.log("generated antlr-ng target into src/generated");
