import { ParserRuleContext, TerminalNode } from "antlr4ng";
import { doc, util, type Doc } from "prettier";
import { FlixLexer as L } from "./generated/FlixLexer.js";
import type { Comment, FlixRoot, TokenInfo } from "./parse.js";

const { group, indent, line, softline, hardline, join, ifBreak, lineSuffix, literalline } = doc.builders;
const { willBreak } = doc.utils;

type Node = ParserRuleContext | TerminalNode;

const isTerm = (n: Node | null | undefined): n is TerminalNode => n instanceof TerminalNode;
const ttype = (t: TerminalNode): number => t.symbol.type;
const kind = (n: Node): string => (isTerm(n) ? "<token>" : n.constructor.name.replace(/Context$/, ""));
const kids = (n: Node): Node[] => (isTerm(n) ? [] : ((n.children ?? []) as Node[]));

function firstTerm(n: Node): TerminalNode | null {
    if (isTerm(n)) return n;
    for (const c of kids(n)) {
        const t = firstTerm(c);
        if (t) return t;
    }
    return null;
}

function lastTerm(n: Node): TerminalNode | null {
    if (isTerm(n)) return n;
    const cs = kids(n);
    for (let i = cs.length - 1; i >= 0; i--) {
        const t = lastTerm(cs[i]);
        if (t) return t;
    }
    return null;
}

/** Last terminal that precedes `n` in document order. */
function prevTerm(n: Node): TerminalNode | null {
    let cur: Node = n;
    while (cur.parent) {
        const sibs = kids(cur.parent as Node);
        for (let i = sibs.indexOf(cur) - 1; i >= 0; i--) {
            const t = lastTerm(sibs[i]);
            if (t) return t;
        }
        cur = cur.parent as Node;
    }
    return null;
}

/** First terminal that follows `n` in document order. */
function nextTerm(n: Node): TerminalNode | null {
    let cur: Node = n;
    while (cur.parent) {
        const sibs = kids(cur.parent as Node);
        for (let i = sibs.indexOf(cur) + 1; i < sibs.length; i++) {
            const t = firstTerm(sibs[i]);
            if (t) return t;
        }
        cur = cur.parent as Node;
    }
    return null;
}

const OPEN_TO_CLOSE = new Map<number, number>([
    [L.LPAREN, L.RPAREN],
    [L.LBRACK, L.RBRACK],
    [L.LBRACE, L.RBRACE],
    [L.HASH_LBRACE, L.RBRACE],
    [L.HASH_LPAREN, L.RPAREN],
    [L.HASH_BAR, L.BAR_HASH],
]);

const HASH_COLLECTIONS = new Set([L.ARRAY_HASH, L.LIST_HASH, L.MAP_HASH, L.SET_HASH, L.VECTOR_HASH]);

/** Characters that make up user operators; two adjacent runs of them would lex as one token. */
const OP_CHARS = "+-*<>=!&|^$";

/** Brace lists printed without inner padding: `use A.{b, c}`, `List#{1, 2}`. */
const NO_PAD = new Set(["UseClause", "ImportClause", "CollectionLiteral"]);
/** Bracket lists whose items are separated by `;` rather than `,`. */
const SEMI_LISTS = new Set(["ForFragments", "ParYieldExpr"]);
/** Brace lists whose items are whole rules laid out one per line. */
const MEMBERS = new Set([
    "MatchRule", "CatchRule", "HandlerRule", "SelectRule", "NewBody", "EnumCase", "TraitMember",
    "InstanceMember", "OpDeclaration", "Declaration", "UsesOrImports", "DatalogConstraint",
]);
/** Rules shaped `head (= | =>) body`, laid out with the body hugged or indented. */
const EQ_BODY = new Set([
    "DefDeclaration", "ValDeclaration", "AliasDeclaration", "AssocTypeDeclaration", "LocalDefExpr",
    "HandlerRule", "NewBody", "MatchRule", "CatchRule", "SelectRule", "LetExpr", "LambdaExpr",
]);
const BODY_ARROWS = new Set([L.EQUAL, L.ARROW_THICK_R, L.ARROW_WS]);
const BINARY = new Set([
    "UserOpExpr", "AngledPlusExpr", "MultExpr", "AddExpr", "ConsExpr", "CompareExpr", "EqualityExpr",
    "AndExpr", "OrExpr",
]);
/** Own-separator nodes: they emit their trailing space or newline themselves. */
const SELF_SPACED = new Set(["DeclPrefix", "AnnotationList", "ModifierList"]);

const CALL_LIKE = new Set([
    L.NAME_LOWERCASE, L.NAME_UPPERCASE, L.NAME_MATH, L.STATIC_UPPER, L.ANNOTATION, L.HOLE_NAMED,
    L.HOLE_VARIABLE, L.SUPER, L.CHECKED_CAST, L.CHECKED_ECAST, L.UNCHECKED_CAST,
]);

export class Printer {
    private flat = 0;
    private consumed = new Set<number>();
    /** Tokens that start a line in the output, so own-line comments need no extra line break. */
    private lineStart = new Set<number>();

    constructor(
        private root: FlixRoot,
        private printWidth = 80,
        private tabWidth = 4,
    ) {}

    // ------------------------------------------------------------------ tokens

    private src(t: TerminalNode): string {
        const s = t.symbol;
        if (s.type === L.EOF) return "";
        return this.root.codePoints.slice(s.start, s.stop + 1).join("");
    }

    private info(t: TerminalNode): TokenInfo | undefined {
        return this.root.info.get(t.symbol.tokenIndex);
    }

    private commentText(c: Comment): Doc {
        if (c.isLine) return c.text;
        const lines = c.text.split("\n");
        if (lines.length === 1) return c.text;
        if (lines.slice(1).every((l) => /^\s*\*/.test(l))) {
            return join(hardline, lines.map((l, i) => (i === 0 ? l : " " + l.trim())));
        }
        return join(literalline, lines);
    }

    private leadDoc(info: TokenInfo, closing: boolean): Doc[] {
        const parts: Doc[] = [];
        info.lead.forEach((c, i) => {
            if (i > 0 && c.nl >= 2) parts.push(hardline);
            parts.push(this.commentText(c));
            parts.push(c.isLine || c.nlNext > 0 ? hardline : " ");
        });
        if (info.lead.length > 0 && info.nlAfter >= 2 && !closing) parts.push(hardline);
        return parts;
    }

    /** `glued`: no space before the comment (after a tight arrow a space would change its class). */
    private trailDoc(info: TokenInfo, glued = false): Doc[] {
        const gap = glued ? "" : " ";
        return info.trail.map((c) =>
            c.isLine || c.nlNext > 0
                ? lineSuffix([gap, this.commentText(c)])
                : [gap, this.commentText(c)],
        );
    }

    /** The token with its leading comments, without trailing comments. */
    private tokCore(t: TerminalNode): Doc {
        const info = this.info(t);
        const idx = t.symbol.tokenIndex;
        const parts: Doc[] = [];
        if (info && !this.consumed.has(idx) && info.lead.length > 0 && this.touchesTightArrow(t)) {
            // `s/* c */->/* c */f`: whitespace around `->` would turn the field access into an
            // arrow, so block comments there stay glued to it.
            parts.push(...info.lead.map((c) => this.commentText(c)));
        } else if (info && !this.consumed.has(idx) && info.lead.length > 0) {
            // An own-line comment must start its own line even when a space was planned here; an
            // inline one (`} /* c */ else`) stays on the line it was written on.
            if (!this.lineStart.has(idx) && info.lead[0].nl > 0) parts.push(hardline);
            parts.push(...this.leadDoc(info, false));
        }
        parts.push(this.src(t));
        return parts;
    }

    /**
     * A separator (`,` `;`) printed right after the token `prev`. When `prev` ends its line with a
     * comment and the separator has a trailing comment of its own, the two would fuse into one
     * comment at the end of the line; the separator's comments then go on lines of their own.
     */
    private separatorTok(prev: TerminalNode | null, sep: TerminalNode): Doc {
        const info = this.info(sep);
        if (prev === null || !this.hasLineTrail(prev) || !info || info.trail.length === 0) return this.tok(sep);
        return [this.tokCore(sep), info.trail.map((c) => [hardline, this.commentText(c)])];
    }

    private touchesTightArrow(t: TerminalNode): boolean {
        if (ttype(t) === L.ARROW_TIGHT) return true;
        const p = prevTerm(t);
        return p !== null && ttype(p) === L.ARROW_TIGHT;
    }

    private tokTrail(t: TerminalNode): Doc {
        const info = this.info(t);
        // `s->// c\nfield`: whitespace after the arrow would turn the field access into a lambda arrow.
        return info ? this.trailDoc(info, ttype(t) === L.ARROW_TIGHT) : "";
    }

    /** A `//` comment (or a block comment that ends its line) ends the line: whatever follows the token must start a new line. */
    private hasLineTrail(t: TerminalNode): boolean {
        return !!this.info(t)?.trail.some((c) => c.isLine || c.nlNext > 0);
    }

    /**
     * What to print after `t`: `soft` (a space, a line, nothing), unless `t` carries a trailing
     * comment that ends its line. That comment is deferred to the end of the output line, so a
     * space here would let the following tokens move in front of it; a hard break (indented when
     * `indented`) flushes it where it was written.
     */
    private after(t: TerminalNode | null, soft: Doc, indented = false): Doc {
        if (t !== null && this.hasLineTrail(t)) return indented ? indent(hardline) : hardline;
        return soft;
    }

    tok(t: TerminalNode): Doc {
        return [this.tokCore(t), this.tokTrail(t)];
    }

    /** Own-line comments in front of a closing token, to be printed inside the block. */
    private takeClosingComments(t: TerminalNode): Doc[] {
        const info = this.info(t);
        if (!info || info.lead.length === 0 || this.consumed.has(t.symbol.tokenIndex)) return [];
        this.consumed.add(t.symbol.tokenIndex);
        const out: Doc[] = [];
        info.lead.forEach((c, i) => {
            if (i > 0 && c.nl >= 2) out.push(hardline);
            out.push(this.commentText(c));
            if (i < info.lead.length - 1) out.push(hardline);
        });
        return out;
    }

    /** Marks the first token of `n` as starting an output line. Call before printing `n`. */
    private ls<T extends Node>(n: T): T {
        const t = firstTerm(n);
        if (t) this.lineStart.add(t.symbol.tokenIndex);
        return n;
    }

    private blankBefore(t: TerminalNode | null): boolean {
        const info = t && this.info(t);
        if (!info) return false;
        return (info.lead.length > 0 ? info.lead[0].nl : info.nlAfter) >= 2;
    }

    private onNewLine(t: TerminalNode | null): boolean {
        const info = t && this.info(t);
        return !!info && info.nlBefore > 0;
    }

    private multiline(n: Node): boolean {
        const a = firstTerm(n);
        const b = lastTerm(n);
        return !!a && !!b && a.symbol.line !== b.symbol.line;
    }

    // ----------------------------------------------------------------- spacing

    private gap(a: TerminalNode, b: TerminalNode, parentKind: string): "" | " " {
        const ta = ttype(a);
        const tb = ttype(b);
        const sa = this.src(a);
        const sb = this.src(b);
        if (OP_CHARS.includes(sa.charAt(sa.length - 1)) && OP_CHARS.includes(sb.charAt(0))) return " ";
        if (tb === L.COMMA || tb === L.SEMI || tb === L.RPAREN || tb === L.RBRACK || tb === L.COLON) return "";
        if (ta === L.LPAREN || ta === L.LBRACK || ta === L.HASH_LPAREN) return "";
        if (ta === L.DOT || ta === L.DOT_WS || tb === L.DOT || tb === L.DOT_WS) return "";
        if (ta === L.HASH || tb === L.HASH) return "";
        if (ta === L.ARROW_TIGHT || tb === L.ARROW_TIGHT) return "";
        if (parentKind === "UseClause" && (ta === L.COLON_COLON_TIGHT || tb === L.COLON_COLON_TIGHT)) return "";
        if (tb === L.LBRACE && HASH_COLLECTIONS.has(ta)) return "";
        if ((tb === L.LPAREN || tb === L.LBRACK) && this.callLike(a)) return "";
        if (parentKind === "SignExpr" && (ta === L.PLUS || ta === L.MINUS)) return "";
        if (parentKind === "UnaryType" && ta === L.TILDE) return "";
        if (parentKind === "InfixCallExpr") {
            if (ta === L.BACKTICK) return this.isOpeningBacktick(a) ? "" : " ";
            if (tb === L.BACKTICK) return this.isOpeningBacktick(b) ? " " : "";
        }
        if (parentKind === "PredicateAndArity" && (ta === L.SLASH || tb === L.SLASH)) return "";
        if (parentKind === "CaseSetType" && (ta === L.ANGLE_L || tb === L.ANGLE_R)) return "";
        if (parentKind === "PrimaryPattern" && ta === L.MINUS) return "";
        return " ";
    }

    private isOpeningBacktick(t: TerminalNode): boolean {
        const sibs = kids(t.parent as Node).filter((c) => isTerm(c) && ttype(c) === L.BACKTICK);
        return sibs[0] === t;
    }

    private callLike(a: TerminalNode): boolean {
        const t = ttype(a);
        if (CALL_LIKE.has(t)) return true;
        const pk = a.parent ? kind(a.parent as Node) : "";
        if (t === L.RPAREN) return pk === "ArgumentList" || pk === "ParenPrimary";
        if (t === L.RBRACK) return pk === "IndexExpr" || pk === "TypeArgs";
        // Operator definitions: `def +(a, b)`, `use A.{+}`.
        const gp = a.parent?.parent ? kind(a.parent.parent as Node) : "";
        return pk === "GenericOperator" && (gp === "DefinitionName" || gp === "UseName");
    }

    // ------------------------------------------------------------- sequences

    /** Prints `children` left to right, spacing tokens and grouping bracket pairs. */
    private seq(children: Node[], parentKind: string): Doc {
        const out: Doc[] = [];
        let prevTerm: TerminalNode | null = null;
        let prevChild: Node | null = null;
        let i = 0;
        while (i < children.length) {
            const ch = children[i];
            let piece: Doc;
            let first: TerminalNode | null;
            let last: TerminalNode | null;
            let step = 1;
            const close = isTerm(ch) && OPEN_TO_CLOSE.has(ttype(ch)) ? this.findClose(children, i) : -1;
            if (close > 0) {
                piece = this.delimited(children, i, close, parentKind);
                first = ch as TerminalNode;
                last = children[close] as TerminalNode;
                step = close - i + 1;
            } else {
                piece = isTerm(ch) ? this.tok(ch) : this.print(ch);
                first = firstTerm(ch);
                last = lastTerm(ch);
            }
            if (prevTerm && first && !(prevChild && SELF_SPACED.has(kind(prevChild)))) {
                if (this.hasLineTrail(prevTerm)) out.push(hardline);
                else {
                    const g = this.gap(prevTerm, first, parentKind);
                    if (g) out.push(g);
                }
            }
            out.push(piece);
            if (last) prevTerm = last;
            prevChild = children[i + step - 1];
            i += step;
        }
        return out;
    }

    private findClose(children: Node[], i: number): number {
        const open = ttype(children[i] as TerminalNode);
        const close = OPEN_TO_CLOSE.get(open)!;
        let depth = 0;
        for (let j = i + 1; j < children.length; j++) {
            const c = children[j];
            if (!isTerm(c)) continue;
            if (ttype(c) === open) depth++;
            else if (ttype(c) === close) {
                if (depth === 0) return j;
                depth--;
            }
        }
        return -1;
    }

    private splitOn(inner: Node[], sep: number): { items: Node[][]; seps: TerminalNode[] } {
        const items: Node[][] = [[]];
        const seps: TerminalNode[] = [];
        for (const n of inner) {
            if (isTerm(n) && ttype(n) === sep) {
                items.push([]);
                seps.push(n);
            } else {
                items[items.length - 1].push(n);
            }
        }
        return { items, seps };
    }

    private joinWithSeps(docs: Doc[], seps: Doc[], afters: Doc[]): Doc[] {
        return docs.flatMap((d, i) => (i < docs.length - 1 ? [d, seps[i], afters[i]] : [d]));
    }

    private hasComment(t: TerminalNode): boolean {
        const info = this.info(t);
        return !!info && (info.lead.length > 0 || info.trail.length > 0);
    }

    /** Measure only atoms whose printed spelling is the same as their source spelling. */
    private atomWidth(n: Node): number | undefined {
        if (isTerm(n)) return this.hasComment(n) ? undefined : util.getStringWidth(this.src(n));
        const cs = kids(n);
        if (cs.length === 1) return this.atomWidth(cs[0]);
        if (kind(n) !== "PlainString" || !cs.every((t) => isTerm(t) && !this.hasComment(t))) return;
        const spelling = (cs as TerminalNode[]).map((t) => this.src(t)).join("");
        if (!/[\t\r\n]/.test(spelling)) return util.getStringWidth(spelling);
    }

    private alignEntries(items: Node[][], layoutId: symbol): Doc[] | undefined {
        if (this.flat > 0 || items.length < 2) return;
        const rows = [];
        for (const item of items) {
            if (item.length !== 1) return;
            const entryKind = kind(item[0]);
            if (entryKind !== "MapEntry" && entryKind !== "RecordOpField") return;
            const [left, delimiter, right, ...rest] = kids(item[0]);
            const expected = entryKind === "MapEntry" ? L.ARROW_THICK_R : L.EQUAL;
            if (rest.length || !right || !isTerm(delimiter) || ttype(delimiter) !== expected || this.hasComment(delimiter)) return;
            const leftWidth = this.atomWidth(left);
            const rightWidth = this.atomWidth(right);
            if (leftWidth === undefined || rightWidth === undefined) return;
            rows.push({ left, delimiter, right, leftWidth, rightWidth });
        }

        const column = rows.reduce((max, row) => Math.max(max, row.leftWidth), 0);
        const shortest = rows.reduce((min, row) => Math.min(min, row.leftWidth), column);
        const padding = column - shortest;
        if (padding === 0 || padding > 8) return;
        // Budget for two indent levels, the separator spaces, and an optional comma.
        if (rows.some((row) =>
            column + this.src(row.delimiter).length + 3 + row.rightWidth + 2 * this.tabWidth > this.printWidth
        )) return;

        return rows.map(({ left, delimiter, right, leftWidth }) => [
            this.print(this.ls(left)),
            ifBreak(" ".repeat(column - leftWidth + 1), " ", { groupId: layoutId }),
            this.tok(delimiter),
            " ",
            this.print(right),
        ]);
    }

    /** Prints `open inner close` with its items laid out as a list or as vertical members. */
    private delimited(children: Node[], i: number, j: number, parentKind: string): Doc {
        const open = children[i] as TerminalNode;
        const close = children[j] as TerminalNode;
        const inner = children.slice(i + 1, j);
        const openType = ttype(open);
        const braces = openType === L.LBRACE || openType === L.HASH_LBRACE || openType === L.HASH_BAR;
        const pad = braces && !NO_PAD.has(parentKind);
        const comments = this.takeClosingComments(close);
        const openDoc = this.tok(open);
        const closeCore = this.tokCore(close);
        const closeTrail = this.tokTrail(close);
        const closeDoc = closeCore;

        if (inner.length === 0 && comments.length === 0) {
            if (this.hasLineTrail(open)) return [openDoc, hardline, closeCore, closeTrail];
            return [openDoc, closeCore, closeTrail];
        }

        const sline = pad ? line : softline;
        const flatSline: Doc = this.flat > 0 ? (pad ? " " : "") : sline;
        const innerLast = inner.length > 0 ? lastTerm(inner[inner.length - 1]) : null;
        const firstSline = this.after(open, flatSline);
        const lastSline = this.after(innerLast, flatSline);
        const tail: Doc[] = comments.flatMap((c) => [hardline, c]);

        const ruleKids = inner.filter((n) => !isTerm(n));
        const isMembers =
            (openType === L.LBRACE || openType === L.HASH_LBRACE) &&
            ruleKids.length > 0 &&
            ruleKids.every((n) => MEMBERS.has(kind(n))) &&
            inner.every((n) => !isTerm(n) || ttype(n) === L.COMMA);
        const sourceMultiline = open.symbol.line !== close.symbol.line;

        if (isMembers || (parentKind === "StructDeclaration" && openType === L.LBRACE)) {
            const structSplit = parentKind === "StructDeclaration" ? this.splitOn(inner, L.COMMA) : null;
            const entries = structSplit ? structSplit.items.filter((x) => x.length > 0) : ruleKids.map((n) => [n]);
            const trailingComma = parentKind === "StructDeclaration" && isTerm(inner[inner.length - 1]);
            const entryDocs = entries.map((entry) => this.seq([this.ls(entry[0]), ...entry.slice(1)], kind(entry[0])));
            const docs: Doc[] = [];
            entries.forEach((entry, k) => {
                const node = entry[0];
                if (k > 0) {
                    const blank = this.blankBefore(firstTerm(node));
                    const prevLast = lastTerm(entries[k - 1][entries[k - 1].length - 1]);
                    docs.push(sourceMultiline || blank ? hardline : this.after(structSplit ? structSplit.seps[k - 1] : prevLast, line));
                    if (blank) docs.push(hardline);
                }
                docs.push(entryDocs[k]);
                if (structSplit && (k < entries.length - 1 || trailingComma)) {
                    docs.push(this.separatorTok(lastTerm(entry[entry.length - 1]), structSplit.seps[k]));
                }
            });
            const body: Doc = [firstSline, docs, tail];
            if (sourceMultiline || comments.length > 0) return [openDoc, indent([hardline, docs, tail]), hardline, closeDoc, closeTrail];
            return [group([openDoc, indent(body), lastSline, closeDoc]), closeTrail];
        }

        const sepType = SEMI_LISTS.has(parentKind) ? L.SEMI : L.COMMA;
        const split = this.splitOn(inner, sepType);
        let items = split.items;
        let trailingTok: TerminalNode | null = null;
        if (items.length > 1 && items[items.length - 1].length === 0) {
            items = items.slice(0, -1);
            trailingTok = split.seps[split.seps.length - 1];
        }
        const collection = children[i - 1];
        const isMap = parentKind === "CollectionLiteral" && isTerm(collection) && ttype(collection) === L.MAP_HASH;
        const layoutId = Symbol();
        const aligned = (isMap || parentKind === "RecordOperation") &&
            ![open, close, ...split.seps].some((t) => this.hasComment(t))
            ? this.alignEntries(items, layoutId)
            : undefined;
        const docs = aligned ?? items.map((it) => this.seq(it.length > 0 ? [this.ls(it[0]), ...it.slice(1)] : it, parentKind));
        const itemLast = (it: Node[]): TerminalNode | null => (it.length > 0 ? lastTerm(it[it.length - 1]) : null);
        const sepDocs = split.seps.slice(0, docs.length - 1).map((t, k) => this.separatorTok(itemLast(items[k]), t));
        // After a separator the next item starts on a new line if a comment ends the line there.
        const sepAfters = split.seps.slice(0, docs.length - 1).map((t, k) =>
            this.hasLineTrail(t) || (itemLast(items[k]) !== null && this.hasLineTrail(itemLast(items[k])!)) ? hardline : this.flat > 0 ? " " : line);

        // Hug a final brace-closed argument (`f(a, x -> {...})`). Decided from the syntax alone, never
        // from how a doc happens to break, so that a second formatting pass changes nothing.
        const lastItem = items[items.length - 1];
        const lastTok = lastItem.length > 0 ? lastTerm(lastItem[lastItem.length - 1]) : null;
        // A comment at any boundary (opener, separator, first or last token of an argument) needs the
        // line break or space the group layout provides; hugging would move it past the call.
        const boundaryTokens = [
            open,
            ...split.seps,
            ...items.flatMap((it) => (it.length > 0 ? [firstTerm(it[0]), lastTerm(it[it.length - 1])] : [])),
        ];
        const commentAtBoundary = boundaryTokens.some((t) => t !== null && this.hasComment(t));
        const huggable =
            !pad && comments.length === 0 && !commentAtBoundary && sepType === L.COMMA && lastTok !== null && ttype(lastTok) === L.RBRACE &&
            !items.slice(0, -1).some((it) => it.length > 0 && lastTerm(it[it.length - 1]) !== null && ttype(lastTerm(it[it.length - 1])!) === L.RBRACE) &&
            !docs.slice(0, -1).some(willBreak);
        if (huggable) return [openDoc, this.joinWithSeps(docs, sepDocs, sepDocs.map(() => " ")), closeDoc, closeTrail];

        const list: Doc[] = this.joinWithSeps(docs, sepDocs, sepAfters);
        if (trailingTok) {
            const ti = this.info(trailingTok);
            const quiet = !ti || (ti.lead.length === 0 && ti.trail.length === 0);
            list.push(quiet ? ifBreak(this.src(trailingTok), "") : this.tok(trailingTok));
        }
        list.push(...tail);
        const preserveMultiline = (pad && openType === L.LBRACE) || (isMap && aligned !== undefined);
        const innerFirst = inner.length > 0 ? firstTerm(inner[0]) : null;
        const forceBreak = preserveMultiline && this.flat === 0 &&
            innerFirst !== null && innerFirst.symbol.line > open.symbol.line;
        return [group(
            [openDoc, indent([firstSline, list]), trailingTok && this.hasLineTrail(trailingTok) ? hardline : lastSline, closeDoc],
            { id: layoutId, shouldBreak: forceBreak || comments.length > 0 },
        ), closeTrail];
    }

    // ------------------------------------------------------------- dispatch

    print(n: Node): Doc {
        if (isTerm(n)) return this.tok(n);
        const k = kind(n);
        if (EQ_BODY.has(k) && this.hasBodyArrow(n)) return this.printEqBody(n);
        if (BINARY.has(k)) return this.printBinary(n);
        switch (k) {
            case "CompilationUnit": return this.printUnit(n);
            case "Statement": return this.printStatement(n);
            case "Block": return this.printBlock(n);
            case "IfExpr": return this.printIf(n);
            case "DeclPrefix": return this.seq(kids(n), k);
            case "AnnotationList": return this.printAnnotations(n);
            case "ModifierList": return kids(n).map((m) => [this.print(m), this.after(lastTerm(m), " ")]);
            case "PlainString":
            case "InterpolatedString": return this.printString(n);
            case "DebugPrimary": return kids(n).map((c) => this.print(c));
            default: return this.seq(kids(n), k);
        }
    }

    printRoot(): Doc {
        return this.print(this.root.tree);
    }

    private printUnit(n: ParserRuleContext): Doc {
        const cs = kids(n);
        const eof = cs[cs.length - 1] as TerminalNode;
        const items = cs.slice(0, -1);
        const itemDocs = items.map((it) => this.print(this.ls(it)));
        const docs: Doc[] = [];
        items.forEach((it, k) => {
            if (k > 0) {
                const prev = items[k - 1];
                const blank = this.blankBefore(firstTerm(it)) || kind(prev) !== kind(it);
                docs.push(hardline);
                if (blank) docs.push(hardline);
            }
            docs.push(itemDocs[k]);
        });
        const info = this.info(eof);
        if (info && info.lead.length > 0) {
            if (items.length > 0) {
                docs.push(hardline);
                if (this.blankBefore(eof)) docs.push(hardline);
            }
            info.lead.forEach((c, i) => {
                if (i > 0) docs.push(hardline, ...(c.nl >= 2 ? [hardline] : []));
                docs.push(this.commentText(c));
            });
        }
        if (info) docs.push(...this.trailDoc(info));
        return docs.length > 0 ? [docs, hardline] : "";
    }

    // ------------------------------------------------------------ statements

    private statementParts(n: ParserRuleContext): { expr: Node; semi: TerminalNode | null }[] {
        const cs = kids(n);
        const parts: { expr: Node; semi: TerminalNode | null }[] = [];
        for (const c of cs) {
            if (isTerm(c)) {
                if (parts.length > 0) parts[parts.length - 1].semi = c;
            } else {
                parts.push({ expr: c, semi: null });
            }
        }
        return parts;
    }

    private printParts(parts: { expr: Node; semi: TerminalNode | null }[], from: number): Doc[] {
        const out: Doc[] = [];
        for (let k = from; k < parts.length; k++) {
            if (k > from) {
                out.push(hardline);
                if (this.blankBefore(firstTerm(parts[k].expr))) out.push(hardline);
            }
            out.push(this.print(this.ls(parts[k].expr)));
            if (parts[k].semi) out.push(this.separatorTok(lastTerm(parts[k].expr), parts[k].semi!));
        }
        return out;
    }

    private printStatement(n: ParserRuleContext): Doc {
        return this.printParts(this.statementParts(n), 0);
    }

    private isMultiStatement(n: ParserRuleContext): boolean {
        const parts = this.statementParts(n);
        return parts.length > 1 || (parts.length === 1 && ["LetExpr", "LocalDefExpr", "UseExpr"].includes(kind(parts[0].expr)));
    }

    private printBlock(n: ParserRuleContext): Doc {
        const cs = kids(n);
        const open = cs[0] as TerminalNode;
        const close = cs[cs.length - 1] as TerminalNode;
        const stmt = cs.length === 3 ? (cs[1] as ParserRuleContext) : null;
        const comments = this.takeClosingComments(close);
        if (!stmt && comments.length === 0) return [this.tok(open), this.tok(close)];
        const body: Doc[] = [];
        if (stmt) body.push(this.print(stmt));
        body.push(...comments.flatMap((c) => (stmt || body.length > 0 ? [hardline, c] : [c])));
        const vertical =
            comments.length > 0 ||
            open.symbol.line !== close.symbol.line ||
            (stmt !== null && this.isMultiStatement(stmt));
        // The closing brace's trailing comment follows the group: inside it, its forced line break
        // would expand a block that otherwise fits on one line.
        const closeCore = this.tokCore(close);
        const closeTrail = this.tokTrail(close);
        if (vertical) return [this.tok(open), indent([hardline, body]), hardline, closeCore, closeTrail];
        return [group([this.tok(open), indent([line, body]), line, closeCore]), closeTrail];
    }

    // --------------------------------------------------------------- if / body

    private isBlockExpr(n: Node): boolean {
        const cs = kids(n);
        if (kind(n) === "PrimaryExpression" && cs.length === 1) return this.isBlockExpr(cs[0]);
        if (kind(n) === "BlockPrimary") return true;
        if (kind(n) === "Expr" || kind(n) === "PrimaryExpr") return cs.length === 1 && this.isBlockExpr(cs[0]);
        return false;
    }

    private printIf(n: ParserRuleContext): Doc {
        const cs = kids(n);
        // IF LPAREN expr RPAREN expr (ELSE expr)?
        const ifTok = cs[0] as TerminalNode;
        const closeParen = cs[3] as TerminalNode;
        const head: Doc = [this.tok(ifTok), this.after(ifTok, " ", true), this.delimited(cs, 1, 3, "IfExpr")];
        const thenNode = cs[4];
        const elseTok = cs[5] as TerminalNode | undefined;
        const elseNode = cs[6];
        const thenHug = this.isBlockExpr(thenNode);
        const thenDoc = this.print(thenHug ? thenNode : this.ls(thenNode));
        const hugs = (e: Node) => this.isBlockExpr(e) || kind(e) === "IfExpr";
        const thenLast = lastTerm(thenNode);
        if (thenHug) {
            const parts: Doc[] = [head, this.after(closeParen, " ", true), thenDoc];
            if (elseTok) {
                parts.push(this.after(thenLast, " "), this.tok(elseTok));
                const elseDoc = this.print(hugs(elseNode) ? elseNode : this.ls(elseNode));
                parts.push(hugs(elseNode) ? [this.after(elseTok, " ", true), elseDoc] : group(indent([line, elseDoc])));
            }
            return parts;
        }
        const parts: Doc[] = [head, indent([this.after(closeParen, line), thenDoc])];
        if (elseTok) {
            this.lineStart.add(elseTok.symbol.tokenIndex); // a line break precedes `else` here
            const elseDoc = this.print(hugs(elseNode) ? elseNode : this.ls(elseNode));
            parts.push(this.after(thenLast, line), this.tok(elseTok), hugs(elseNode) ? [this.after(elseTok, " ", true), elseDoc] : indent([line, elseDoc]));
        }
        return group(parts);
    }

    private hasBodyArrow(n: ParserRuleContext): boolean {
        return kids(n).some((c) => isTerm(c) && BODY_ARROWS.has(ttype(c)));
    }

    /** Places `body` after `arrow`: hugged on the arrow's line when it spans lines, else wrapped. */
    private placeBody(body: Node, arrow: TerminalNode): Doc {
        const f = firstTerm(body);
        const l = lastTerm(body);
        const sameLine = !!f && f.symbol.line === arrow.symbol.line;
        // Hug when the author kept the body on the arrow's line and it closes with a brace.
        if (sameLine && l !== null && ttype(l) === L.RBRACE) return [this.after(arrow, " ", true), this.print(body)];
        const d = this.print(this.ls(body));
        if (sameLine && willBreak(d)) return [this.after(arrow, " ", true), d];
        return group(indent([this.after(arrow, line), d]));
    }

    /** `head = body`, `case p => body`, `x -> body`; `let` and local `def` own the rest of their block. */
    private printEqBody(n: ParserRuleContext): Doc {
        const cs = kids(n);
        const k = kind(n);
        const ai = cs.findIndex((c) => isTerm(c) && BODY_ARROWS.has(ttype(c)));
        const arrow = cs[ai] as TerminalNode;
        const headLast = ai > 0 ? lastTerm(cs[ai - 1]) : null;
        const head = [this.seq(cs.slice(0, ai), k), this.after(headLast, " ", true), this.tok(arrow)];
        const body = cs[ai + 1];
        const rest = cs.slice(ai + 2);
        const restDoc = rest.length > 0 ? this.seq(rest, k) : "";
        const comma = rest.length > 0 && isTerm(rest[0]) && ttype(rest[0] as TerminalNode) === L.COMMA;
        const tailDoc: Doc = rest.length > 0 ? (comma ? restDoc : [" ", restDoc]) : "";

        if (kind(body) !== "Statement") return [head, this.placeBody(body, arrow), tailDoc];

        const stmt = body as ParserRuleContext;
        const parts = this.statementParts(stmt);
        if (k === "LetExpr" || k === "LocalDefExpr") {
            // The statement is the remainder of the enclosing block: only its first expression
            // belongs to this binding.
            const first = parts[0];
            const out: Doc[] = [head, this.placeBody(first.expr, arrow)];
            if (first.semi) out.push(this.separatorTok(lastTerm(first.expr), first.semi));
            if (parts.length > 1) out.push(hardline, ...this.restSeparator(parts[1].expr), ...this.printParts(parts, 1));
            return [out, tailDoc];
        }
        if (this.isMultiStatement(stmt)) return [head, indent([hardline, this.printStatement(stmt)]), tailDoc];
        const only = parts[0];
        const out: Doc[] = [head, this.placeBody(only.expr, arrow)];
        if (only.semi) out.push(this.separatorTok(lastTerm(only.expr), only.semi));
        return [out, tailDoc];
    }

    private restSeparator(next: Node): Doc[] {
        return this.blankBefore(firstTerm(next)) ? [hardline] : [];
    }

    // --------------------------------------------------------------- operators

    private printBinary(n: ParserRuleContext): Doc {
        const k = kind(n);
        const rightAssoc = k === "ConsExpr";
        const operands: Node[] = [];
        const ops: Node[] = [];
        const collect = (m: ParserRuleContext): void => {
            const [l, op, r] = kids(m);
            if (rightAssoc) {
                operands.push(l);
                ops.push(op);
                if (kind(r) === k) collect(r as ParserRuleContext);
                else operands.push(r);
            } else {
                if (kind(l) === k) collect(l as ParserRuleContext);
                else operands.push(l);
                ops.push(op);
                operands.push(r);
            }
        };
        collect(n);
        const links = ops.map((op, i) => {
            // Multiline list constructors follow the leading :: style in the Flix examples.
            const leadingCons = rightAssoc && isTerm(op) && ttype(op) !== L.COLON_COLON_COLON;
            const breakPoint = this.flat > 0 ? " " : line;
            return {
                operator: [this.after(lastTerm(operands[i]), leadingCons ? breakPoint : " "), this.print(op)],
                after: this.after(lastTerm(op), leadingCons ? " " : breakPoint),
                operand: this.print(this.ls(operands[i + 1])),
            };
        });
        const first = this.print(operands[0]);
        if (k !== "AddExpr" || !ops.every((op) => isTerm(op) && ttype(op) === L.PLUS)) {
            return group([first, indent(links.map(({ operator, after, operand }) => [operator, after, operand]))]);
        }

        // A newline literal acts as a separator. Keep it with the preceding text when that
        // segment fits, while retaining the ordinary break points at narrower widths.
        const segments: Doc[][] = [[first]];
        for (const [i, { operator, after, operand }] of links.entries()) {
            const segment = segments[segments.length - 1];
            segment.push(operator);
            const left = firstTerm(operands[i]);
            const right = lastTerm(operands[i]);
            const newline = i > 0 && left && right && right.symbol.stop - left.symbol.start === 3 &&
                this.root.codePoints.slice(left.symbol.start, right.symbol.stop + 1).join("") === '"\\n"';
            if (newline) segments.push([after, operand]);
            else segment.push(after, operand);
        }
        const [head, ...tail] = segments;
        if (tail.length === 0) return group([first, indent(head.slice(1))]);
        return group([
            group([head[0], indent(head.slice(1))]),
            indent(tail.map(([before, ...parts]) => [before, group(parts)])),
        ]);
    }

    // ------------------------------------------------------- annotations, strings

    private printAnnotations(n: ParserRuleContext): Doc {
        const anns = kids(n);
        const out: Doc[] = [];
        anns.forEach((a, i) => {
            out.push(this.print(a));
            const next = i + 1 < anns.length ? firstTerm(anns[i + 1]) : nextTerm(n);
            const lastTok = lastTerm(a);
            out.push(this.onNewLine(next) || (lastTok !== null && this.hasLineTrail(lastTok)) ? hardline : " ");
        });
        return out;
    }

    private printString(n: ParserRuleContext): Doc {
        const out: Doc[] = [];
        for (const c of kids(n)) {
            if (isTerm(c)) {
                out.push(this.tok(c));
            } else {
                this.flat++;
                out.push(this.print(c));
                this.flat--;
            }
        }
        return out;
    }
}
