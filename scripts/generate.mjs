#!/usr/bin/env node
/**
 * Generate antlr-ng TypeScript targets for each supported Flix grammar pin.
 *
 * - `flix-0.80.0` comes from the pinned `@wstein/flix-antlr-grammar` package.
 * - `flix-0.79.0` comes from the vendored pin under `third_party/`.
 *
 * Their embedded actions use Java syntax, and antlr-ng's TypeScript target
 * ignores `options { superClass }`. Adapt each generated copy:
 *
 *   1. Pre-process a TypeScript-flavored copy of the grammars into build/.
 *   2. Run antlr-ng over the copy into `src/generated/<grammarId>/`.
 *   3. Patch the generated lexer to extend the shared FlixLexerBase.
 *
 * Run via `npm run generate`.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");
const outRoot = join(pkg, "src", "generated");

/** Helpers defined on FlixLexerBase; unqualified in Java, `this.`-qualified in TypeScript. */
const HELPERS = [
    "isNameCharFollow", "classifyColonColon", "classifyArrow", "classifyDot", "classifyOperator",
    "enterBrace", "exitBrace", "openInterpolation", "stripEscape", "popMode",
];

/** Grammar sources keyed by FlixGrammarId. */
const PINS = [
    {
        id: "flix-0.80.0",
        root: join(pkg, "node_modules", "@wstein", "flix-antlr-grammar"),
        copyLexerBase: true,
    },
    {
        id: "flix-0.79.0",
        root: join(pkg, "third_party", "flix-antlr-grammar-0.79.0"),
        copyLexerBase: false,
    },
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

function generateOne({ id, root, copyLexerBase }) {
    const src = join(root, "grammars");
    const staged = join(pkg, "build", "grammar", id);
    const out = join(outRoot, id);

    rmSync(staged, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
    mkdirSync(staged, { recursive: true });
    mkdirSync(out, { recursive: true });

    if (copyLexerBase) {
        copyFileSync(join(root, "antlr-ng", "src", "FlixLexerBase.ts"), join(pkg, "src", "FlixLexerBase.ts"));
    }

    for (const file of readdirSync(src).filter((f) => f.endsWith(".g4"))) {
        writeFileSync(join(staged, file), toTypeScript(readFileSync(join(src, file), "utf8")));
    }

    execFileSync(
        "npx",
        ["antlr-ng", "-o", out, "-D", "language=TypeScript", "--generate-visitor",
            "--generate-listener", "false", join(staged, "FlixLexer.g4"), join(staged, "FlixParser.g4")],
        { cwd: pkg, stdio: "inherit" },
    );

    // Nested under src/generated/<id>/, so FlixLexerBase lives two levels up.
    const lexerBaseImport = 'from "../../FlixLexerBase.js"';
    const lexerFile = join(out, "FlixLexer.ts");
    let lexer = readFileSync(lexerFile, "utf8");
    if (!lexer.includes(lexerBaseImport)) {
        const lines = lexer.split("\n");
        const lastImport = lines.reduce((acc, l, i) => (l.startsWith("import ") ? i : acc), -1);
        lines.splice(lastImport + 1, 0, `import { FlixLexerBase } ${lexerBaseImport};`);
        lexer = lines.join("\n").replace(
            /export class FlixLexer extends \w+ \{/,
            "export class FlixLexer extends FlixLexerBase {",
        );
        writeFileSync(lexerFile, lexer);
    }
    console.log(`generated antlr-ng target into src/generated/${id}`);
}

mkdirSync(outRoot, { recursive: true });
for (const pin of PINS) generateOne(pin);
