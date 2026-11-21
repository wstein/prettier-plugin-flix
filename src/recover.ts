import { CharStream, CommonTokenStream, ParserRuleContext, type Token } from "antlr4ng";
import { grammarIdForVersion, resolveFlixVersion } from "./flix-version.js";
import { FlixLexer as L } from "./generated/FlixLexer.js";
import {
    ConstraintSetContext,
    DeclarationContext,
    DotContext,
    EnumDeclarationTailContext,
    FlixParser,
    ModDeclarationContext,
    StructDeclarationContext,
    UsesOrImportsContext,
} from "./generated/FlixParser.js";

type Layout = {
    printWidth: number;
    tabWidth: number;
    useTabs: boolean;
    endOfLine?: "lf";
    /** Exact Flix compiler version; must match the grammar used by `format`. */
    flixVersion?: string;
};
type Format = (source: string, options: Layout) => Promise<string>;
type Unit = "declaration" | "module" | "datalog" | "enum" | "struct";
type Slice = { start: number; end: number; unit: Unit; indent: string };

const declarationStarts = new Set([
    L.USE, L.IMPORT, L.DEF, L.REDEF, L.VAL, L.MOD, L.ENUM, L.STRUCT, L.TRAIT, L.INSTANCE, L.EFF, L.TYPE,
]);
const declarationPrefixes = new Set([L.ANNOTATION, L.PUB, L.SEALED, L.MUT, L.RESTRICTABLE]);
const closers = new Map([
    [L.LPAREN, L.RPAREN], [L.LBRACK, L.RBRACK], [L.LBRACE, L.RBRACE], [L.HASH_LBRACE, L.RBRACE],
    [L.HASH_LPAREN, L.RPAREN], [L.HASH_BAR, L.BAR_HASH], [L.INTERPOLATION_START, L.INTERPOLATION_END],
]);
const closingTokens = new Set(closers.values());
const wrappers = {
    module: "mod Recovery {",
    datalog: "def recovery() = #{",
    enum: "enum Recovery {",
    struct: "struct Recovery {",
};

function matchingDelimiters(tokens: Token[]): Map<number, number> {
    const pairs = new Map<number, number>();
    const stack: Token[] = [];
    for (const token of tokens) {
        if (closers.has(token.type)) stack.push(token);
        else if (closingTokens.has(token.type)) {
            // Pop only until this closer is accounted for so outer braces in a
            // module or Datalog block still pair after one mismatched delimiter.
            let matchIndex = -1;
            for (let i = stack.length - 1; i >= 0; i--) {
                if (closers.get(stack[i].type) === token.type) {
                    matchIndex = i;
                    break;
                }
            }
            if (matchIndex >= 0) {
                stack.length = matchIndex + 1;
                const open = stack.pop()!;
                pairs.set(open.tokenIndex, token.tokenIndex);
            }
        }
    }
    return pairs;
}

function recoverySlices(source: string, layout: Layout): Slice[] {
    // Same version gate as full formatting; grammar selection hooks in here later.
    void grammarIdForVersion(resolveFlixVersion(layout.flixVersion));
    const lexer = new L(CharStream.fromString(source));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    const parser = new FlixParser(stream);
    parser.removeErrorListeners();
    const tree = parser.compilationUnit();
    stream.fill();
    const tokens = stream.getTokens();
    const slices: Slice[] = [];
    const qualifiedDots = new Set<number>();
    const enclosed: { node: ParserRuleContext; unit: Unit; open: Token; close?: Token }[] = [];
    const offsets = [0];
    for (const ch of source) offsets.push(offsets[offsets.length - 1] + ch.length);
    const startOf = (token: Token) => offsets[token.start];
    const endOf = (token: Token) => offsets[token.stop + 1];
    const unclosedComment = tokens.find((token) => token.type === L.SLASH && source.startsWith("/*", startOf(token)));
    const limit = unclosedComment ? startOf(unclosedComment) : source.length;
    const code = tokens.filter((token) => token.channel === 0 && token.type !== L.EOF && startOf(token) < limit);
    const pairs = matchingDelimiters(code);
    const lineStart = (pos: number) => Math.max(source.lastIndexOf("\n", pos - 1), source.lastIndexOf("\r", pos - 1)) + 1;
    const indentAt = (pos: number) => /^[ \t]*/.exec(source.slice(lineStart(pos)))![0];

    function add(first: Token, last: Token, next: Token | undefined, unit: Unit, indent: string): void {
        const firstOffset = startOf(first);
        const start = lineStart(firstOffset);
        if (!/^[ \t]*$/.test(source.slice(start, firstOffset))) return;
        // The complete last line includes any trailing comment. Sharing it with the next
        // unit would make ownership ambiguous.
        const lastOffset = endOf(last);
        const eol = /[\r\n]/.exec(source.slice(lastOffset));
        const end = eol ? lastOffset + eol.index : source.length;
        if (end > limit || next && startOf(next) < end) return;
        slices.push({ start, end, unit, indent });
    }

    function split(scope: ParserRuleContext, unit: Unit, open?: Token, close?: Token): void {
        if (open && (!close || pairs.get(open.tokenIndex) !== close.tokenIndex)) return;
        const from = open?.tokenIndex ?? -1;
        const to = close?.tokenIndex ?? tokens.length;
        const entries = code.filter((token) => token.tokenIndex > from && token.tokenIndex < to);
        const level = unit === "declaration" ? "" :
            indentAt(startOf(open!)) + (layout.useTabs ? "\t" : " ".repeat(layout.tabWidth));
        const starts = new Set<number>();
        if (unit === "declaration" || unit === "module") {
            for (const node of scope.children ?? []) {
                if ((node instanceof DeclarationContext || node instanceof UsesOrImportsContext) && node.start) {
                    starts.add(node.start.tokenIndex);
                }
            }
        }

        let prefix: Token | undefined;
        let previous: Token | undefined;
        const partitionStarts: number[] = [];
        const partitionEnds: number[] = [];
        for (let i = 0; i < entries.length; i++) {
            const token = entries[i];
            const kind = token.type;
            const firstOnLine = /^[ \t]*$/.test(source.slice(lineStart(startOf(token)), startOf(token)));
            if (unit === "declaration" || unit === "module") {
                if (declarationPrefixes.has(kind) && firstOnLine && indentAt(startOf(token)) === level) prefix ??= token;
                if (declarationStarts.has(kind) && (prefix || firstOnLine && indentAt(startOf(token)) === level)) {
                    starts.add((prefix ?? token).tokenIndex);
                    prefix = undefined;
                }
                if (!declarationPrefixes.has(kind) && !(kind === L.LPAREN && previous?.type === L.ANNOTATION)) {
                    prefix = undefined;
                }
            } else if (unit === "enum" && kind === L.CASE && firstOnLine) partitionStarts.push(i);
            else if (unit === "struct" && kind === L.COMMA) partitionEnds.push(i);
            else if (unit === "datalog" && (kind === L.DOT || kind === L.DOT_WS || kind === L.FREE_DOT)) {
                const next = entries[i + 1];
                // A final dot can separate even a damaged rule. Dots inside
                // qualified names and expressions are not boundaries.
                if (!qualifiedDots.has(token.tokenIndex) &&
                    (!next || lineStart(startOf(next)) !== lineStart(startOf(token)))) partitionEnds.push(i);
            }

            previous = token;
            const paired = pairs.get(token.tokenIndex);
            if (paired !== undefined && paired < to) {
                while (entries[i + 1]?.tokenIndex <= paired) i++;
            } else if (closers.has(kind)) {
                // Unclosed opener: end the in-progress slice at this token when
                // partitions are terminator-based, then keep scanning so later
                // sibling dots/fields still split. Module/enum starts are filled
                // from `starts` / `case` below, so they only need to continue.
                if (unit === "datalog" || unit === "struct") partitionEnds.push(i);
            }
        }

        if (unit === "declaration" || unit === "module") {
            for (const [i, token] of entries.entries()) {
                if (starts.has(token.tokenIndex)) partitionStarts.push(i);
            }
        }
        if (partitionStarts.length || unit === "declaration" || unit === "module" || unit === "enum") {
            for (const [i, start] of partitionStarts.entries()) {
                const end = partitionStarts[i + 1] ?? entries.length;
                add(entries[start], entries[end - 1], entries[end] ?? close, unit, level);
            }
        } else {
            let start = 0;
            if (unit === "struct" && partitionEnds.at(-1) !== entries.length - 1 && entries.length) {
                partitionEnds.push(entries.length - 1);
            }
            for (const end of partitionEnds) {
                add(entries[start], entries[end], entries[end + 1] ?? close, unit, level);
                start = end + 1;
            }
        }
    }

    function visit(node: ParserRuleContext): void {
        if (node instanceof DotContext && node.start) qualifiedDots.add(node.start.tokenIndex);
        const unit = node instanceof ModDeclarationContext ? "module" :
            node instanceof ConstraintSetContext ? "datalog" :
            node instanceof EnumDeclarationTailContext ? "enum" :
            node instanceof StructDeclarationContext ? "struct" : undefined;
        if (unit) {
            const open = node.getToken(unit === "datalog" ? L.HASH_LBRACE : L.LBRACE, 0)?.symbol;
            if (open && open.tokenIndex >= 0) enclosed.push({ node, unit, open, close: node.getToken(L.RBRACE, 0)?.symbol });
        }
        for (const child of node.children ?? []) {
            if (child instanceof ParserRuleContext) visit(child);
        }
    }
    visit(tree);
    split(tree, "declaration");
    for (const item of enclosed) {
        // An unclosed construct can leave the AST without a `}` child even when
        // the source still has a matching brace. Prefer the lexically paired
        // closer so module / Datalog bodies keep splitting.
        const paired = pairs.get(item.open.tokenIndex);
        if (paired !== undefined && item.close?.tokenIndex !== paired) {
            item.close = code.find((token) => token.tokenIndex === paired);
        }
        split(item.node, item.unit, item.open, item.close);
    }
    return slices.sort((a, b) => a.start - b.start || b.end - a.end);
}

function indentationWidth(indent: string, tabWidth: number): number {
    let column = 0;
    for (const ch of indent) column += ch === "\t" ? tabWidth - column % tabWidth : 1;
    return column;
}

async function formatSlice(text: string, slice: Slice, layout: Layout, format: Format): Promise<string | undefined> {
    try {
        if (slice.unit === "declaration") return (await format(text, { ...layout, endOfLine: "lf" })).trimEnd();

        const header = wrappers[slice.unit];
        const indent = layout.useTabs ? "\t" : " ".repeat(layout.tabWidth);
        const printWidth = layout.printWidth - indentationWidth(slice.indent, layout.tabWidth) + layout.tabWidth;
        if (printWidth <= 0) return undefined;
        const output = await format(`${header}\n${text}\n}\n`, { ...layout, printWidth, endOfLine: "lf" });
        if (!output.startsWith(header + "\n") || !output.endsWith("\n}\n")) return undefined;
        const lines = output.slice(header.length + 1, -3).split("\n");
        if (lines.some((line) => line && !line.startsWith(indent))) return undefined;
        return lines.map((line) => line ? slice.indent + line.slice(indent.length) : "").join("\n");
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return undefined;
    }
}

/** Keep invalid text intact and print only independently parseable source ranges. */
export async function recoverFormatting(source: string, layout: Layout, format: Format): Promise<string | undefined> {
    const replacements: string[] = [];
    let end = 0;
    let coveredEnd = 0;
    const lineEnding = source.match(/\r\n|\r|\n/)?.[0] ?? "\n";
    for (const slice of recoverySlices(source, layout)) {
        if (slice.start < coveredEnd) continue;
        const original = source.slice(slice.start, slice.end);
        const formatted = await formatSlice(original, slice, layout, format);
        if (formatted === undefined) continue;
        coveredEnd = slice.end;
        const text = formatted.replace(/\n/g, lineEnding);
        if (text === original) continue;
        replacements.push(source.slice(end, slice.start), text);
        end = slice.end;
    }
    if (!replacements.length) return undefined;
    return replacements.join("") + source.slice(end);
}
