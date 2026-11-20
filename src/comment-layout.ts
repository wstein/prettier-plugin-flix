import { CharStream, CommonTokenStream, ParserRuleContext, TerminalNode, type ParseTree, type Token } from "antlr4ng";
import { doc, util, type Doc } from "prettier";
import { FlixLexer as L } from "./generated/FlixLexer.js";
import { DefDeclarationContext } from "./generated/FlixParser.js";
import { ignoredDeclarationEnd, parseFlix, type FlixRoot } from "./parse.js";

type LayoutOptions = { printWidth: number; tabWidth: number; useTabs: boolean };
type Scope = { parent: Scope | undefined };
type Row = { line: number; scope: Scope | undefined; indent: number; startsBody: boolean; code: string; width: number; comment: string };
const OPEN = new Set([L.LPAREN, L.LBRACK, L.LBRACE, L.HASH_LBRACE, L.HASH_LPAREN, L.HASH_BAR, L.INTERPOLATION_START]);
const CLOSE = new Set([L.RPAREN, L.RBRACK, L.RBRACE, L.BAR_HASH, L.INTERPOLATION_END]);
const CARET = /^\/\/[ \t]*\^+/;
export const LINE_COMMENT_GAP = "  ";

function lex(text: string): Token[] {
    const lexer = new L(CharStream.fromString(text));
    lexer.removeErrorListeners();
    const stream = new CommonTokenStream(lexer);
    stream.fill();
    return stream.getTokens().filter((token) => token.type !== L.WS && token.type !== L.EOF);
}

function isCode(token: Token): boolean {
    return token.channel === 0;
}

function width(text: string, tabWidth: number): number {
    const [first, ...fields] = text.split("\t");
    return fields.reduce((column, field) => column + tabWidth - column % tabWidth + util.getStringWidth(field),
        util.getStringWidth(first));
}

function before(lines: string[], token: Token): string {
    return Array.from(lines[token.line - 1]).slice(0, token.column).join("");
}

function indentation(text: string): string {
    return /^[ \t]*/.exec(text)![0];
}

/** Locate printed definition separators using the source parse tree and code-token order. */
function printedDefinitionEquals(root: FlixRoot, tokens: Token[]): Set<Token> {
    const input: Token[] = [];
    const equals = new Set<Token>();
    function visit(node: ParseTree): void {
        if (node instanceof TerminalNode) {
            if (node.symbol.type !== L.EOF) input.push(node.symbol);
            return;
        }
        if (node instanceof DefDeclarationContext) {
            const separator = node.EQUAL();
            if (separator && root.info.get(separator.symbol.tokenIndex)?.trail.some((comment) => comment.isLine)) {
                equals.add(separator.symbol);
            }
        }
        for (let i = 0; i < node.getChildCount(); i++) visit(node.getChild(i)!);
    }
    visit(root.tree);
    const output = tokens.filter(isCode);
    return equals.size && sameTokens(input, output, false)
        ? new Set(output.filter((_, i) => equals.has(input[i])))
        : new Set();
}

function lineCommentGroups(tokens: Token[], lines: string[], tabWidth: number, definitionEquals: Set<Token>,
    ignoredLines?: ReadonlySet<number>): Row[][] {
    const groups: Row[][] = [];
    let scope: Scope | undefined;
    let lineScope: Scope | undefined;
    let lastCode: Token | undefined;
    let group: Row[] = [];
    for (const token of tokens) {
        if (isCode(token)) {
            if (lastCode?.line !== token.line) lineScope = scope;
            if (OPEN.has(token.type)) scope = { parent: scope };
            if (CLOSE.has(token.type)) scope = scope?.parent;
            lastCode = token;
            continue;
        }
        if (token.type !== L.LINE_COMMENT || lastCode?.line !== token.line || ignoredLines?.has(token.line) ||
            lastCode.type === L.ARROW_TIGHT || scope !== lineScope || !token.text ||
            token.text.startsWith("///") || token.text.includes("\t") || CARET.test(token.text)) continue;

        const code = before(lines, token).trimEnd();
        const indent = width(indentation(code), tabWidth);
        const prev = group.at(-1);
        const startsBody = definitionEquals.has(lastCode);
        const continuesDefinition = prev?.startsBody && indent === prev.indent + tabWidth;
        if (!prev || token.line !== prev.line + 1 || scope !== prev.scope ||
            startsBody || (indent !== prev.indent && !continuesDefinition)) {
            group = [];
            groups.push(group);
        }
        group.push({ line: token.line, scope, indent, startsBody, code, width: width(code, tabWidth), comment: token.text });
    }
    return groups;
}

function alignGroup(group: Row[], lines: string[], printWidth: number): boolean {
    if (group.length < 2) return true;
    const column = group.reduce((longest, row) => Math.max(longest, row.width), 0) + LINE_COMMENT_GAP.length;
    if (group.some((row) => column + util.getStringWidth(row.comment) > printWidth)) return false;
    for (const row of group) lines[row.line - 1] = row.code + " ".repeat(column - row.width) + row.comment;
    return true;
}

function alignTrailingComments(root: FlixRoot, tokens: Token[], lines: string[], options: LayoutOptions,
    ignoredLines?: ReadonlySet<number>): void {
    const hasCommentedEquals = tokens.some((token, i) => token.type === L.EQUAL &&
        tokens[i + 1]?.type === L.LINE_COMMENT && tokens[i + 1].line === token.line);
    const definitionEquals = hasCommentedEquals ? printedDefinitionEquals(root, tokens) : new Set<Token>();
    for (const group of lineCommentGroups(tokens, lines, options.tabWidth, definitionEquals, ignoredLines)) {
        if (!alignGroup(group, lines, options.printWidth) && group[0].startsBody) {
            alignGroup(group.slice(1), lines, options.printWidth);
        }
    }
}

/** Replay only comment alignment and describe it if it accounts for the entire diff. */
export function explainTrailingCommentAlignment(source: string, output: string, options: LayoutOptions) {
    if (source === output || !source.includes("//")) return undefined;
    let root: FlixRoot;
    try {
        root = parseFlix(source);
    } catch (error) {
        if (error instanceof SyntaxError) return undefined;
        throw error;
    }
    const tokens = lex(source);
    const lines = source.split("\n");
    const expected = [...lines];
    alignTrailingComments(root, tokens, expected, options, ignoredDeclarationLines(root));
    if (expected.join("\n") !== output) return undefined;

    return tokens.flatMap((token) => {
        const i = token.line - 1;
        if (token.type !== L.LINE_COMMENT || lines[i] === expected[i]) return [];
        const prefix = before(lines, token);
        const code = prefix.trimEnd();
        const codeWidth = width(code, options.tabWidth);
        const alignedPrefix = expected[i].slice(0, -token.text!.length);
        return [{
            line: token.line,
            beforeColumns: width(prefix, options.tabWidth) - codeWidth,
            afterColumns: width(alignedPrefix, options.tabWidth) - codeWidth,
        }];
    });
}

function commentText(token: Token): string {
    return (token.text ?? "").trimEnd();
}

function sameTokens(a: Token[], b: Token[], types: boolean): boolean {
    return a.length === b.length && a.every((token, i) =>
        (!types || token.type === b[i].type) &&
        (isCode(token) ? token.text === b[i].text : commentText(token) === commentText(b[i])));
}

/** Keep source-indented continuations under the trailing comment after a comma. */
function alignCommentContinuations(source: string, output: Token[], lines: string[], tabWidth: number,
    ignoredLines?: ReadonlySet<number>): void {
    const input = lex(source);
    const original = source.split("\n");
    const outputComments = output.filter((token) => !isCode(token));
    if (!sameTokens(input.filter((token) => !isCode(token)), outputComments, true)) return;

    let commentIndex = 0;
    for (const [i, token] of input.entries()) {
        if (isCode(token)) continue;
        const anchor = outputComments[commentIndex++];
        const comma = input[i - 1];
        if (token.type !== L.LINE_COMMENT || comma?.type !== L.COMMA || comma.line !== token.line ||
            ignoredLines?.has(anchor.line) || !before(lines, anchor).trim()) continue;

        // Find the uninterrupted run of standalone comments and the next item, if present.
        let end = i + 1;
        while (input[end]?.type === L.LINE_COMMENT && input[end].line === input[end - 1].line + 1 &&
            !before(original, input[end]).trim()) end++;
        if (end === i + 1) continue;
        const next = input[end];
        const nextIndent = next && isCode(next) && next.line > input[end - 1].line
            ? width(indentation(original[next.line - 1]), tabWidth) : 0;
        const itemIndent = Math.max(nextIndent, width(indentation(original[token.line - 1]), tabWidth));
        const anchorLine = lines[anchor.line - 1].trimEnd();
        const column = width(anchorLine.slice(0, -commentText(anchor).length), tabWidth);
        const indent = indentation(anchorLine);
        const padding = indent + " ".repeat(column - width(indent, tabWidth));
        for (let j = i + 1; j < end; j++) {
            const continuation = input[j];
            const printed = outputComments[commentIndex + j - i - 1];
            if (CARET.test(commentText(continuation)) || commentText(continuation).slice(2).trim() === "prettier-ignore" ||
                width(before(original, continuation), tabWidth) <= itemIndent ||
                printed.line !== anchor.line + j - i || ignoredLines?.has(printed.line) || before(lines, printed).trim()) break;
            lines[printed.line - 1] = padding + commentText(printed);
        }
    }
}

/** Move standalone caret lines with the code token marked on the preceding input line. */
function placeCaretComments(source: string, output: Token[], lines: string[], tabWidth: number,
    ignoredLines?: ReadonlySet<number>): string[] {
    const input = lex(source);
    const originalLines = source.split("\n");
    const inputCode = input.filter(isCode);
    const outputCode = output.filter(isCode);
    const inputComments = input.filter((token) => !isCode(token));
    const outputComments = output.filter((token) => !isCode(token));
    if (!sameTokens(inputCode, outputCode, false) || !sameTokens(inputComments, outputComments, false)) return lines;

    const replacements = new Map<number, string>();
    const moves: { from: number; after: number; text: string }[] = [];
    for (const [i, token] of inputComments.entries()) {
        const caret = CARET.exec(commentText(token));
        if (token.type !== L.LINE_COMMENT || !caret || before(originalLines, token).trim()) continue;
        const comment = outputComments[i];
        if (ignoredLines?.has(comment.line) || before(lines, comment).trim()) continue;
        const markerOffset = caret[0].indexOf("^");
        const markerColumn = width(before(originalLines, token) + caret[0].slice(0, markerOffset), tabWidth);
        const anchorIndex = inputCode.findIndex((candidate) => {
            if (candidate.line !== token.line - 1) return false;
            const column = width(before(originalLines, candidate), tabWidth);
            return column <= markerColumn && markerColumn < column + util.getStringWidth(candidate.text ?? "");
        });
        const anchor = outputCode[anchorIndex];
        const oldAnchor = inputCode[anchorIndex];
        const indent = anchor === undefined ? width(before(originalLines, token), tabWidth) :
            width(before(lines, anchor), tabWidth) + markerColumn - width(before(originalLines, oldAnchor), tabWidth) - markerOffset;
        if (indent < 0) continue;
        const text = " ".repeat(indent) + commentText(comment);
        if (anchor && anchor.line !== comment.line - 1) {
            // Reordering comments can change which node they document. Move only
            // across code, and keep isolated annotations for ambiguous cases.
            const from = comment.line - 1;
            const after = anchor.line - 1;
            const crossesComment = outputComments.some((other) => other !== comment &&
                other.line - 1 > Math.min(from, after) && other.line - 1 <= Math.max(from, after));
            const crossesIgnored = ignoredLines && [...ignoredLines].some((line) =>
                line - 1 >= Math.min(from, after) && line - 1 <= Math.max(from, after));
            if (!crossesComment && !crossesIgnored) moves.push({ from, after, text });
        } else {
            replacements.set(comment.line - 1, text);
        }
    }
    if (!replacements.size && !moves.length) return lines;
    const moved = new Set(moves.map(({ from }) => from));
    const revised = lines.flatMap((line, i) => [
        ...(moved.has(i) ? [] : [replacements.get(i) ?? line]),
        ...moves.filter(({ after }) => i === after).map(({ text }) => text),
    ]);
    const tokens = lex(revised.join("\n"));
    return sameTokens(outputCode, tokens.filter(isCode), true) &&
        sameTokens(outputComments, tokens.filter((token) => !isCode(token)), true) ? revised : lines;
}

type TupleCell = {
    kind: "text" | "integer" | "decimal" | "character" | "boolean" | "regex" | "null" | "tuple" | "collection";
    text: string;
    before: number;
    after: number;
};
type TupleRow = { indent: string; cells: TupleCell[]; suffix: string; line: number };
const TABLE_COLLECTIONS = new Set([L.VECTOR_HASH, L.LIST_HASH, L.ARRAY_HASH, L.SET_HASH]);

function delimiterDepth(type: number): number {
    return OPEN.has(type) ? 1 : CLOSE.has(type) ? -1 : 0;
}

function isStringLiteral(tokens: Token[]): boolean {
    const start = tokens[0]?.type === L.DEBUG_INTERPOLATOR ? 1 : 0;
    if (tokens[start]?.type !== L.STRING_START) return false;
    let depth = 0;
    for (let i = start; i < tokens.length; i++) {
        if (tokens[i].type === L.STRING_START) depth++;
        if (tokens[i].type === L.STRING_END && --depth === 0) return i === tokens.length - 1;
    }
    return false;
}

function nestedCellKind(tokens: Token[]): "tuple" | "collection" | undefined {
    const first = tokens[0].type;
    const collection = TABLE_COLLECTIONS.has(first) || first === L.MAP_HASH;
    if (collection ? tokens[1]?.type !== L.LBRACE : first !== L.LPAREN) return;
    let depth = 0;
    let tuple = false;
    for (let i = collection ? 1 : 0; i < tokens.length; i++) {
        const type = tokens[i].type;
        if (type === L.COMMA && depth === 1) tuple = true;
        depth += delimiterDepth(type);
        if (depth === 0) {
            if (i === tokens.length - 1 && (collection || tuple)) return collection ? "collection" : "tuple";
            return;
        }
    }
}

function tupleCell(tokens: Token[], line: string[]): TupleCell | undefined {
    const first = tokens[0];
    const last = tokens.at(-1);
    if (!first || !last) return;
    let kind: TupleCell["kind"];
    if (isStringLiteral(tokens)) {
        kind = "text";
    } else if ((tokens.length === 1 || (tokens.length === 2 && first.type === L.MINUS)) &&
        (last.type === L.INT_LITERAL || last.type === L.HEX_LITERAL || last.type === L.FLOAT_LITERAL)) {
        kind = last.type === L.FLOAT_LITERAL ? "decimal" : "integer";
    } else if (tokens.length === 1 && first.type === L.CHAR_LITERAL) {
        kind = "character";
    } else if (tokens.length === 1 && (first.type === L.TRUE || first.type === L.FALSE)) {
        kind = "boolean";
    } else if (tokens.length === 1 && first.type === L.REGEX_LITERAL) {
        kind = "regex";
    } else if (tokens.length === 1 && first.type === L.NULL) {
        kind = "null";
    } else {
        const nested = nestedCellKind(tokens);
        if (!nested) return;
        kind = nested;
    }
    const text = line.slice(first.column, last.column + Array.from(last.text ?? "").length).join("");
    if (/[\t\r\n]/.test(text)) return;
    const width = util.getStringWidth(text);
    // For a suffix-only or exponent-only literal, the point is implicit after the mantissa.
    const before = kind === "decimal" ? text.split(/[.ef]/, 1)[0].length : kind === "integer" ? width : 0;
    return { kind, text, before, after: width - before };
}

function tupleRow(tokens: Token[], text: string, line: number): TupleRow | undefined {
    const row = tokens.slice();
    if (row.at(-1)?.type === L.LINE_COMMENT) row.pop();
    if (row.at(-1)?.type === L.COMMA) row.pop();
    const close = row.pop();
    if (row[0]?.type !== L.LPAREN || close?.type !== L.RPAREN) return;

    const chars = Array.from(text);
    const indent = chars.slice(0, row[0].column).join("");
    if (indent.trim()) return;
    const cells: TupleCell[] = [];
    let start = 1;
    let depth = 0;
    for (let i = 1; i <= row.length; i++) {
        if (i < row.length) {
            const type = row[i].type;
            depth += delimiterDepth(type);
            if (type !== L.COMMA || depth !== 0) continue;
        }
        const cell = tupleCell(row.slice(start, i), chars);
        if (!cell) return;
        cells.push(cell);
        start = i + 1;
    }
    if (cells.length < 2) return;
    return { indent, cells, suffix: chars.slice(close.column + 1).join(""), line };
}

function alignTupleRows(tokens: Token[], lines: string[], options: LayoutOptions, ignoredLines?: ReadonlySet<number>): boolean {
    const byLine = new Map<number, Token[]>();
    for (const token of tokens) {
        const row = byLine.get(token.line);
        if (row) row.push(token);
        else byLine.set(token.line, [token]);
    }
    let changed = false;
    for (const [openingLine, opening] of byLine) {
        if (ignoredLines?.has(openingLine) || opening.at(-1)?.type !== L.LBRACE || !TABLE_COLLECTIONS.has(opening.at(-2)?.type ?? -1)) continue;
        const rows: TupleRow[] = [];
        let line = openingLine + 1;
        for (; line <= lines.length; line++) {
            const row = tupleRow(byLine.get(line) ?? [], lines[line - 1], line);
            if (!row) break;
            rows.push(row);
        }
        if (rows.length < 2 || byLine.get(line)?.[0].type !== L.RBRACE) continue;
        const first = rows[0];
        if (!rows.every((row) => row.indent === first.indent && row.cells.length === first.cells.length &&
            row.cells.every((cell, col) => cell.kind === first.cells[col].kind))) continue;
        const widths = first.cells.map((_, col) => rows.reduce(({ before, after }, { cells }) => ({
            before: Math.max(before, cells[col].before),
            after: Math.max(after, cells[col].after),
        }), { before: 0, after: 0 }));
        const aligned = rows.map((row) => {
            const fields = row.cells.map((cell, col) => {
                const leading = " ".repeat(widths[col].before - cell.before);
                const separator = col === widths.length - 1 ? "" : ", " + " ".repeat(widths[col].after - cell.after);
                return leading + cell.text + separator;
            });
            return row.indent + "(" + fields.join("") + ")" + row.suffix;
        });
        if (aligned.some((text, i) => {
            const original = lines[rows[i].line - 1];
            const originalWidth = width(original, options.tabWidth);
            if (width(text, options.tabWidth) <= Math.max(options.printWidth, originalWidth)) return false;
            // If a comment alone already exceeds the target, the aligned code still has room.
            const comment = rows[i].suffix.indexOf("//");
            return originalWidth <= options.printWidth || comment < 0 ||
                width(text.slice(0, text.length - rows[i].suffix.length + comment).trimEnd(), options.tabWidth) > options.printWidth;
        })) continue;
        rows.forEach((row, i) => {
            changed ||= lines[row.line - 1] !== aligned[i];
            lines[row.line - 1] = aligned[i];
        });
    }
    return changed;
}

function ignoredDeclarationLines(root: FlixRoot): Set<number> | undefined {
    if (!root.text.includes("prettier-ignore")) return;
    const lines = new Set<number>();
    function visit(node: ParseTree): void {
        if (!(node instanceof ParserRuleContext)) return;
        const end = ignoredDeclarationEnd(root, node);
        if (end !== undefined) {
            const { start, stop } = node;
            const tail = root.codePoints.slice(stop!.start, end).join("");
            const lastLine = stop!.line + tail.split("\n").length - 1;
            for (let line = start!.line; line <= lastLine; line++) lines.add(line);
            return;
        }
        for (let i = 0; i < node.getChildCount(); i++) visit(node.getChild(i)!);
    }
    visit(root.tree);
    return lines;
}

export function layoutSource(root: FlixRoot, value: Doc, options: LayoutOptions): Doc {
    let trailing = 0;
    let hasCaret = false;
    for (const info of root.info.values()) {
        trailing += info.trail.filter((comment) => comment.isLine && comment.text.startsWith("//")).length;
        hasCaret ||= info.lead.some((comment) => CARET.test(comment.text));
    }
    const mayHaveTupleRows = /\b(?:Vector|List|Array|Set)#\s*\{\s*\(/.test(root.text);
    const mayHaveContinuations = /,[ \t]*\/\/[^\n]*\n[ \t]+\/\//.test(root.text);
    if (trailing < 2 && !hasCaret && !mayHaveTupleRows && !mayHaveContinuations) return value;

    // Measure the chosen layout, including wrapped code, actual indentation,
    // and the full comment widths, before changing horizontal space.
    const { formatted } = doc.printer.printDocToString(value, options);
    let ignoredLines: ReadonlySet<number> | undefined;
    if (ignoredDeclarationLines(root)?.size) {
        // Post-layout edits use printed line numbers, which can differ from the input.
        ignoredLines = ignoredDeclarationLines(parseFlix(formatted));
    }
    let tokens = lex(formatted);
    let lines = formatted.split("\n");
    if (mayHaveTupleRows && alignTupleRows(tokens, lines, options, ignoredLines) &&
        (trailing > 1 || hasCaret || mayHaveContinuations)) {
        tokens = lex(lines.join("\n"));
    }
    if (trailing > 1) alignTrailingComments(root, tokens, lines, options, ignoredLines);
    if (mayHaveContinuations) alignCommentContinuations(root.text, tokens, lines, options.tabWidth, ignoredLines);
    if (hasCaret) lines = placeCaretComments(root.text, tokens, lines, options.tabWidth, ignoredLines);
    return lines.join("\n") === formatted ? value : doc.builders.join(doc.builders.literalline, lines);
}
