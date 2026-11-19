import { CharStream, CommonTokenStream, type Token } from "antlr4ng";
import { doc, util, type Doc } from "prettier";
import { FlixLexer as L } from "./generated/FlixLexer.js";
import type { FlixRoot } from "./parse.js";

type LayoutOptions = { printWidth: number; tabWidth: number; useTabs: boolean };
type Scope = { parent: Scope | undefined };
type Row = { line: number; scope: Scope | undefined; indent: number; code: string; width: number; comment: string };
const OPEN = new Set([L.LPAREN, L.LBRACK, L.LBRACE, L.HASH_LBRACE, L.HASH_LPAREN, L.HASH_BAR, L.INTERPOLATION_START]);
const CLOSE = new Set([L.RPAREN, L.RBRACK, L.RBRACE, L.BAR_HASH, L.INTERPOLATION_END]);
const CARET = /^\/\/[ \t]*\^+/;
const MAX_PADDING = 8;
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

function lineCommentGroups(tokens: Token[], lines: string[], tabWidth: number): Row[][] {
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
        if (token.type !== L.LINE_COMMENT || lastCode?.line !== token.line ||
            lastCode.type === L.ARROW_TIGHT || scope !== lineScope || !token.text ||
            token.text.startsWith("///") || token.text.includes("\t") || CARET.test(token.text)) continue;

        const code = before(lines, token).trimEnd();
        const indent = width(/^[ \t]*/.exec(code)![0], tabWidth);
        const prev = group.at(-1);
        if (!prev || token.line !== prev.line + 1 || scope !== prev.scope || indent !== prev.indent) {
            group = [];
            groups.push(group);
        }
        group.push({ line: token.line, scope, indent, code, width: width(code, tabWidth), comment: token.text });
    }
    return groups;
}

function alignTrailingComments(tokens: Token[], lines: string[], options: LayoutOptions): void {
    for (const group of lineCommentGroups(tokens, lines, options.tabWidth)) {
        if (group.length < 2) continue;
        const column = group.reduce((longest, row) => Math.max(longest, row.width), 0) + LINE_COMMENT_GAP.length;
        if (group.some((row) => column - row.width - LINE_COMMENT_GAP.length > MAX_PADDING ||
            column + util.getStringWidth(row.comment) > options.printWidth)) continue;
        for (const row of group) lines[row.line - 1] = row.code + " ".repeat(column - row.width) + row.comment;
    }
}

function commentText(token: Token): string {
    return (token.text ?? "").trimEnd();
}

function sameTokens(a: Token[], b: Token[], types: boolean): boolean {
    return a.length === b.length && a.every((token, i) =>
        (!types || token.type === b[i].type) &&
        (isCode(token) ? token.text === b[i].text : commentText(token) === commentText(b[i])));
}

/** Move standalone caret lines with the code token marked on the preceding input line. */
function placeCaretComments(source: string, output: Token[], lines: string[], tabWidth: number): string[] {
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
        if (before(lines, comment).trim()) continue;
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
            if (!crossesComment) moves.push({ from, after, text });
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

export function layoutComments(root: FlixRoot, value: Doc, options: LayoutOptions): Doc {
    let trailing = 0;
    let hasCaret = false;
    for (const info of root.info.values()) {
        trailing += info.trail.filter((comment) => comment.isLine && comment.text.startsWith("//")).length;
        hasCaret ||= info.lead.some((comment) => CARET.test(comment.text));
    }
    if (trailing < 2 && !hasCaret) return value;

    // Measure the chosen layout, including wrapped code, actual indentation,
    // and the full comment widths, before changing horizontal space.
    const { formatted } = doc.printer.printDocToString(value, options);
    const tokens = lex(formatted);
    let lines = formatted.split("\n");
    if (trailing > 1) alignTrailingComments(tokens, lines, options);
    if (hasCaret) lines = placeCaretComments(root.text, tokens, lines, options.tabWidth);
    return lines.join("\n") === formatted ? value : doc.builders.join(doc.builders.literalline, lines);
}
