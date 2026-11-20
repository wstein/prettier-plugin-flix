import { ParserRuleContext, TerminalNode } from "antlr4ng";
import { doc, util, type Doc } from "prettier";
import { FlixLexer as L } from "./generated/FlixLexer.js";
import { ignoredDeclarationEnd, type Comment, type FlixRoot, type TokenInfo } from "./parse.js";
import { LINE_COMMENT_GAP } from "./comment-layout.js";

const { align, breakParent, conditionalGroup, group, indent, line, softline, hardline, join, ifBreak, lineSuffix, literalline } = doc.builders;
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

function isAccessDot(t: TerminalNode): boolean {
    return (ttype(t) === L.DOT || ttype(t) === L.DOT_WS) && kind(t.parent as Node) === "Dot";
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
const TIGHT_OPERATORS = new Set([L.ARROW_TIGHT, L.COLON_COLON_TIGHT]);

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
const DECLARATION_BLOCKS = new Set(["ModDeclaration", "TraitDeclaration", "InstanceDeclaration", "EffectDeclaration"]);

const CALL_LIKE = new Set([
    L.NAME_LOWERCASE, L.NAME_UPPERCASE, L.NAME_MATH, L.STATIC_UPPER, L.ANNOTATION, L.HOLE_NAMED,
    L.HOLE_VARIABLE, L.SUPER, L.CHECKED_CAST, L.CHECKED_ECAST, L.UNCHECKED_CAST,
]);

export class Printer {
    private flat = 0;
    private consumed = new Set<number>();
    /** Tokens that start a line in the output, so own-line comments need no extra line break. */
    private lineStart = new Set<number>();
    private handlerArgumentOpeners = new Set<number>();

    constructor(
        private root: FlixRoot,
        private printWidth: number,
        private tabWidth: number,
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

    private leadDoc(info: TokenInfo, closing: boolean, inlineGap = " "): Doc[] {
        const parts: Doc[] = [];
        info.lead.forEach((c, i) => {
            if (i > 0 && c.nl >= 2) parts.push(hardline);
            parts.push(this.commentText(c));
            parts.push(c.isLine || c.nlNext > 0 ? hardline : inlineGap);
        });
        if (info.lead.length > 0 && info.nlAfter >= 2 && !closing) parts.push(hardline);
        return parts;
    }

    private trailDoc(info: TokenInfo, gap = " "): Doc[] {
        return info.trail.map((c) => {
            const comment = this.commentText(c);
            const spacing = gap && c.isLine && !c.text.startsWith("///") ? LINE_COMMENT_GAP : gap;
            return c.isLine || c.nlNext > 0 ? lineSuffix([spacing, comment]) : [spacing, comment];
        });
    }

    private tokenLeadingDoc(t: TerminalNode): Doc[] {
        const info = this.info(t);
        const idx = t.symbol.tokenIndex;
        if (!info?.lead.length || this.consumed.has(idx)) return [];
        if (this.touchesTightOperator(t)) {
            // Keep block comments glued to `->` or `::` so the operator stays tight.
            return info.lead.map((c) => this.commentText(c));
        }
        // An own-line comment must start its own line even when a space was planned here.
        const before = !this.lineStart.has(idx) && info.lead[0].nl > 0 ? [hardline] : [];
        const previous = prevTerm(t);
        const touchesDot = isAccessDot(t) || (previous !== null && ttype(previous) === L.DOT && isAccessDot(previous));
        return [...before, ...this.leadDoc(info, false, touchesDot ? "" : " ")];
    }

    /** Print comments above an expression outside its fit group. */
    private takeLeadingOwnLineComments(t: TerminalNode | null): Doc[] {
        if (!t || (this.info(t)?.lead[0]?.nl ?? 0) === 0) return [];
        const leading = this.tokenLeadingDoc(t);
        this.consumed.add(t.symbol.tokenIndex);
        return leading;
    }

    /** The token with its leading comments, without trailing comments. */
    private tokCore(t: TerminalNode): Doc {
        return [...this.tokenLeadingDoc(t), this.src(t)];
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

    private touchesTightOperator(t: TerminalNode): boolean {
        if (TIGHT_OPERATORS.has(ttype(t))) return true;
        const p = prevTerm(t);
        return p !== null && TIGHT_OPERATORS.has(ttype(p));
    }

    private tokTrail(t: TerminalNode): Doc {
        // `a.// c\nb`: the comment must touch the dot. Datalog terminators use whitespace instead.
        if (ttype(t) === L.DOT && isAccessDot(t)) {
            const info = this.info(t);
            return info ? this.trailDoc(info, "") : "";
        }
        const info = this.info(t);
        // A space before a glued line comment would change the operator token.
        const gap = TIGHT_OPERATORS.has(ttype(t)) ? "" : " ";
        return info ? this.trailDoc(info, gap) : "";
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
        if (ta === L.DOT_WS && isAccessDot(a)) return " ";
        if (tb === L.COMMA || tb === L.SEMI || tb === L.RPAREN || tb === L.RBRACK || tb === L.COLON) return "";
        if (ta === L.LPAREN || ta === L.LBRACK || ta === L.HASH_LPAREN) return "";
        if (ta === L.DOT || ta === L.DOT_WS || tb === L.DOT || tb === L.DOT_WS) return "";
        if (ta === L.HASH || tb === L.HASH) return "";
        if (TIGHT_OPERATORS.has(ta) || TIGHT_OPERATORS.has(tb)) return "";
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
                first = ch as TerminalNode;
                piece = [
                    this.takeLeadingOwnLineComments(first),
                    this.delimited(children, i, close, parentKind),
                ];
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

    private hasComment(t: TerminalNode, ignoreTrailing = false, ignoreOwnLine = false): boolean {
        const info = this.info(t);
        return !!info && (info.lead.some((comment) => !ignoreOwnLine || comment.nl === 0) ||
            (!ignoreTrailing && info.trail.length > 0));
    }

    /** Measure atoms and supported single-line map or record values. */
    private inlineWidth(n: Node, rowEnd: TerminalNode | null = null, extra?: "list" | "add",
        rowStart?: TerminalNode | null): number | undefined {
        if (isTerm(n)) return this.hasComment(n, n === rowEnd, n === rowStart) ? undefined : util.getStringWidth(this.src(n));
        const cs = kids(n);
        if (cs.length === 1) return this.inlineWidth(cs[0], rowEnd, extra, rowStart);
        if (extra === "list" && kind(n) === "CollectionLiteral" && isTerm(cs[0]) && ttype(cs[0]) === L.LIST_HASH) {
            return this.flatListWidth(cs, rowEnd);
        }
        if (extra === "add" && kind(n) === "AddExpr") {
            const [left, operator, right] = cs;
            const leftWidth = this.inlineWidth(left);
            const rightWidth = this.inlineWidth(right, rowEnd);
            if (leftWidth !== undefined && rightWidth !== undefined && isTerm(operator) && !this.hasComment(operator)) {
                return leftWidth + this.src(operator).length + 2 + rightWidth;
            }
            return;
        }
        if (kind(n) !== "PlainString" || !cs.every((t) => isTerm(t) && !this.hasComment(t, t === rowEnd, t === rowStart))) return;
        const spelling = (cs as TerminalNode[]).map((t) => this.src(t)).join("");
        if (!/[\t\r\n]/.test(spelling)) return util.getStringWidth(spelling);
    }

    private flatListWidth(children: Node[], rowEnd: TerminalNode | null): number | undefined {
        const tokens = [children[0], children[1], children[children.length - 1]];
        if (tokens.some((token) => !isTerm(token) || this.hasComment(token, token === rowEnd))) return;
        let width = "List#{}".length;
        if (children.length === 3) return width;

        const { items, seps } = this.splitOn(children.slice(2, -1), L.COMMA);
        if (seps.some((separator) => this.hasComment(separator))) return;
        for (const item of items) {
            if (item.length !== 1) return;
            const itemWidth = this.inlineWidth(item[0]);
            if (itemWidth === undefined) return;
            width += itemWidth;
        }
        return width + 2 * seps.length;
    }

    private alignmentGroups<T>(items: T[], first: (item: T) => TerminalNode | null): T[][] {
        const groups: T[][] = [];
        let group: T[] = [];
        for (const item of items) {
            const token = first(item);
            if (group.length && (this.blankBefore(token) || (token && this.info(token)?.lead.some((comment) => comment.nl > 0)))) {
                groups.push(group);
                group = [];
            }
            group.push(item);
        }
        if (group.length) groups.push(group);
        return groups;
    }

    private alignEntries(items: Node[][], seps: TerminalNode[], layoutId: symbol): Doc[] | undefined {
        if (this.flat > 0 || items.length < 2) return;
        const rows = [];
        for (const item of items) {
            if (item.length !== 1) return;
            const entryKind = kind(item[0]);
            if (entryKind !== "MapEntry" && entryKind !== "RecordOpField") return;
            const [left, delimiter, right, ...rest] = kids(item[0]);
            const expected = entryKind === "MapEntry" ? L.ARROW_THICK_R : L.EQUAL;
            if (rest.length || !right || !isTerm(delimiter) || ttype(delimiter) !== expected || this.hasComment(delimiter)) return;
            const leftWidth = this.inlineWidth(left, null, undefined, firstTerm(left));
            // Suffix comments stay with their entry and take no space in the code columns.
            const end = lastTerm(right);
            const rightWidth = this.inlineWidth(right, end, entryKind === "MapEntry" ? "list" : "add");
            if (leftWidth === undefined || rightWidth === undefined) return;
            rows.push({ left, delimiter, right, end, leftWidth, rightWidth });
        }

        const column = rows.reduce((max, row) => Math.max(max, row.leftWidth), 0);
        const shortest = rows.reduce((min, row) => Math.min(min, row.leftWidth), column);
        const padding = column - shortest;
        if (padding > 8) return;
        const measured = rows.map(({ end, delimiter, rightWidth }, i) => ({
            end,
            width: column + this.src(delimiter).length + 2 + rightWidth + (seps[i] ? 1 : 0),
        }));
        // Each row needs room for the code plus two levels of indentation.
        if (measured.some(({ width }) => width + 2 * this.tabWidth > this.printWidth)) return;
        if (padding === 0) return;

        return rows.map(({ left, delimiter, right, leftWidth }) => [
            this.print(this.ls(left)),
            ifBreak(" ".repeat(column - leftWidth + 1), " ", { groupId: layoutId }),
            this.tok(delimiter),
            " ",
            this.print(right),
        ]);
    }

    private printListItem(item: Node[], parentKind: string): Doc {
        if (item.length === 0) return "";
        const [field, bar, ...base] = item;
        this.ls(field);
        const hasRowTail = parentKind === "RecordOperation" || parentKind === "RecordType" ||
            parentKind === "RecordPattern" || parentKind === "TupleType" ||
            parentKind === "SchemaType" || parentKind === "SchemaRowType";
        if (this.flat === 0 && hasRowTail && isTerm(bar) && ttype(bar) === L.BAR && !this.hasComment(bar)) {
            return [
                this.print(field),
                group([this.after(lastTerm(field), line), this.seq([bar, ...base], parentKind)]),
            ];
        }
        return this.seq(item, parentKind);
    }

    /** Prints `open inner close` with its items laid out as a list or as vertical members. */
    private delimited(children: Node[], i: number, j: number, parentKind: string, groupList = true): Doc {
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
        const compactHandlerClose = this.handlerArgumentOpeners.has(open.symbol.tokenIndex) && comments.length === 0;
        const lastSline = this.after(innerLast, compactHandlerClose ? "" : flatSline);
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
            const entries = structSplit ? structSplit.items.filter((x) => x.length > 0) : [];
            if (!structSplit) {
                for (const rule of ruleKids) {
                    const previous = entries.at(-1);
                    const first = firstTerm(rule);
                    const last = previous && lastTerm(previous[previous.length - 1]);
                    if (kind(rule) === "EnumCase" && previous && last && ttype(last) === L.COMMA &&
                        first && ttype(first) === L.NAME_UPPERCASE) previous.push(rule);
                    else entries.push([rule]);
                }
            }
            const trailingComma = parentKind === "StructDeclaration" && isTerm(inner[inner.length - 1]);
            const layoutId = Symbol();
            const entryDocs = this.alignMatchRules(ruleKids, layoutId) ?? entries.map((entry) => {
                if (entry.length > 1 && kind(entry[0]) === "EnumCase") {
                    return group([
                        this.print(this.ls(entry[0])),
                        indent(entry.slice(1).map((item, i) => [
                            this.after(lastTerm(entry[i]), line), this.print(this.ls(item)),
                        ])),
                    ]);
                }
                return this.seq([this.ls(entry[0]), ...entry.slice(1)], kind(entry[0]));
            });
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
            const vertical = sourceMultiline || comments.length > 0;
            return [group([
                openDoc, indent([vertical ? hardline : firstSline, docs, tail]), vertical ? hardline : lastSline, closeDoc,
            ], { id: layoutId, shouldBreak: vertical }), closeTrail];
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
        const alignable = isMap || parentKind === "RecordOperation";
        const mayAlign = alignable &&
            !this.hasComment(open) && !this.hasComment(close, true) &&
            !split.seps.some((t) => this.hasComment(t, true));
        let offset = 0;
        let aligned = false;
        const groups = mayAlign ? this.alignmentGroups(items, (it) => it[0] ? firstTerm(it[0]) : null) : [items];
        const docs = groups.flatMap((rows) => {
            const formatted = mayAlign ? this.alignEntries(rows, split.seps.slice(offset, offset + rows.length), layoutId) : undefined;
            offset += rows.length;
            aligned ||= formatted !== undefined;
            return formatted ?? rows.map((item) => this.printListItem(item, parentKind));
        });
        const itemLast = (it: Node[]): TerminalNode | null => (it.length > 0 ? lastTerm(it[it.length - 1]) : null);
        const sepDocs = split.seps.slice(0, docs.length - 1).map((t, k) => this.separatorTok(itemLast(items[k]), t));
        // After a separator the next item starts on a new line if a comment ends the line there.
        const sepAfters = split.seps.slice(0, docs.length - 1).map((t, k) => {
            const next = items[k + 1][0];
            if (alignable && next && this.blankBefore(firstTerm(next))) return [hardline, hardline];
            return this.hasLineTrail(t) || (itemLast(items[k]) !== null && this.hasLineTrail(itemLast(items[k])!))
                ? hardline : this.flat > 0 ? " " : line;
        });

        // Syntax decides whether a final brace-closed argument can hug. A
        // trailing lambda also needs room on the line where the call starts.
        const lastItem = items[items.length - 1];
        const lastTok = lastItem.length > 0 ? lastTerm(lastItem[lastItem.length - 1]) : null;
        const finalArgument = lastItem[0] && kind(lastItem[0]) === "Argument" ? kids(lastItem[0])[0] : undefined;
        const matchCallback = finalArgument && kind(finalArgument) === "LambdaExpr" &&
            kind(kids(finalArgument).at(-1)!) === "MatchExpr" && willBreak(docs[docs.length - 1]);
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
            !(items.length > 1 && matchCallback) &&
            !items.slice(0, -1).some((it) => it.length > 0 && lastTerm(it[it.length - 1]) !== null && ttype(lastTerm(it[it.length - 1])!) === L.RBRACE) &&
            !docs.slice(0, -1).some(willBreak);
        const hugged: Doc | undefined = huggable
            ? [openDoc, this.joinWithSeps(docs, sepDocs, sepDocs.map(() => " ")), closeDoc]
            : undefined;
        if (hugged && (!finalArgument || kind(finalArgument) !== "LambdaExpr" || !groupList)) {
            return [hugged, closeTrail];
        }

        const list: Doc[] = this.joinWithSeps(docs, sepDocs, sepAfters);
        if (trailingTok) {
            const ti = this.info(trailingTok);
            const quiet = !ti || (ti.lead.length === 0 && ti.trail.length === 0);
            list.push(quiet ? ifBreak(this.src(trailingTok), "") : this.tok(trailingTok));
        }
        list.push(...tail);
        const preserveMultiline = (pad && openType === L.LBRACE) || (isMap && aligned);
        const innerFirst = inner.length > 0 ? firstTerm(inner[0]) : null;
        const forceBreak = preserveMultiline && this.flat === 0 &&
            innerFirst !== null && innerFirst.symbol.line > open.symbol.line;
        const contents: Doc = [
            openDoc, indent([firstSline, list]), trailingTok && this.hasLineTrail(trailingTok) ? hardline : lastSline, closeDoc,
        ];
        if (hugged) {
            // A conditional group's alternatives do not propagate forced
            // breaks. Preserve the enclosing layout of a multiline callback.
            const propagateBreak = willBreak(hugged) ? breakParent : "";
            return [conditionalGroup([hugged, contents], { id: layoutId }), propagateBreak, closeTrail];
        }
        return [
            groupList ? group(contents, { id: layoutId, shouldBreak: forceBreak || comments.length > 0 }) : contents,
            closeTrail,
        ];
    }

    // ------------------------------------------------------------- dispatch

    print(n: Node): Doc {
        if (isTerm(n)) return this.tok(n);
        const k = kind(n);
        if (k === "Declaration") {
            const end = ignoredDeclarationEnd(this.root, n);
            if (end !== undefined) {
                const first = firstTerm(n)!;
                const raw = this.root.codePoints.slice(first.symbol.start, end).join("");
                return [this.tokenLeadingDoc(first), join(literalline, raw.split("\n"))];
            }
        }
        if (EQ_BODY.has(k) && this.hasBodyArrow(n)) return this.printEqBody(n);
        if (BINARY.has(k)) return this.printBinary(n);
        switch (k) {
            case "CompilationUnit": return this.printUnit(n);
            case "ArrowType": return this.printArrowType(n);
            case "Statement": return this.printStatement(n);
            case "UseExpr": return this.printUseExpr(n);
            case "Block": return this.printBlock(n);
            case "IfExpr": return this.printIf(n);
            case "ForeachExpr": return this.printForeach(n);
            case "ForYieldExpr": return this.printForYield(n);
            case "ParYieldExpr": return this.printParYield(n);
            case "FixpointExpr": return this.printFixpoint(n);
            case "WithClause": return this.printWithClause(n);
            case "DatalogConstraint": return this.printConstraint(n);
            case "RunWithExpr": return this.printRunWith(n);
            case "DefDeclaration":
            case "OpDeclaration": return this.printSignature(n, kids(n));
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

    private printUseExpr(n: ParserRuleContext): Doc {
        const children = kids(n);
        if (this.flat > 0) return this.seq(children, kind(n));
        const [clause, semi, expr] = children;
        return [
            this.print(clause), this.separatorTok(lastTerm(clause), semi as TerminalNode),
            hardline, ...this.restSeparator(expr), this.print(this.ls(expr)),
        ];
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

    private printIf(n: ParserRuleContext, groupChain = true): Doc {
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
            const elseDoc = kind(elseNode) === "IfExpr" ? this.printIf(elseNode as ParserRuleContext, false) :
                this.print(hugs(elseNode) ? elseNode : this.ls(elseNode));
            parts.push(this.after(thenLast, line), this.tok(elseTok), hugs(elseNode) ? [this.after(elseTok, " ", true), elseDoc] : indent([line, elseDoc]));
        }
        return groupChain ? group(parts) : parts;
    }

    private printForeach(n: ParserRuleContext): Doc {
        const children = kids(n);
        const [keyword, fragments, body] = children;
        if (this.flat > 0 || this.isBlockExpr(body)) return this.seq(children, kind(n));
        return group([
            this.seq([keyword, fragments], kind(n)),
            indent([this.after(lastTerm(fragments), line), this.print(this.ls(body))]),
        ]);
    }

    private hasBodyArrow(n: ParserRuleContext): boolean {
        return kids(n).some((c) => isTerm(c) && BODY_ARROWS.has(ttype(c)));
    }

    private printForYield(n: ParserRuleContext): Doc {
        const [keyword, fragments, yieldKeyword, body] = kids(n);
        if (this.flat > 0) return this.seq(kids(n), kind(n));
        const parts = kids(fragments);
        return group(this.yieldDocs(keyword, parts, "ForFragments", yieldKeyword, body));
    }

    private printParYield(n: ParserRuleContext, afterEquals = false): Doc {
        const children = kids(n);
        if (this.flat > 0) return this.seq(children, kind(n));
        const [keyword, ...parts] = children.slice(0, -2);
        const [yieldKeyword, body] = children.slice(-2);
        const leading = this.takeLeadingOwnLineComments(firstTerm(keyword));
        const value = this.yieldDocs(keyword, parts, "ParYieldExpr", yieldKeyword, body);
        const compact = group(value);
        if (!afterEquals) return [leading, compact];

        // Keep the opener on the binding line when possible. Move the whole
        // expression only if there is no room even for `par (`.
        return conditionalGroup([
            [" ", compact],
            [" ", group(value, { shouldBreak: true })],
            indent([line, compact]),
        ]);
    }

    private yieldDocs(keyword: Node, parts: Node[], k: string, yieldKeyword: Node, body: Node): Doc {
        // Include the yield expression when deciding whether the bindings fit.
        return [
            this.print(keyword), this.after(lastTerm(keyword), " "),
            this.delimited(parts, 0, parts.length - 1, k, false),
            this.after(lastTerm(parts.at(-1)!), " "), this.print(yieldKeyword),
            this.after(lastTerm(yieldKeyword), " ", true), this.print(body),
        ];
    }

    private printFixpoint(n: ParserRuleContext): Doc {
        const children = kids(n);
        const [keyword, sources, ...clauses] = children;
        if (this.flat > 0 || !isTerm(keyword)) return this.seq(children, kind(n));
        const type = ttype(keyword);
        const isQuery = type === L.QUERY || type === L.PQUERY;
        if (!isQuery && type !== L.SOLVE && type !== L.PSOLVE && type !== L.INJECT) {
            return this.seq(children, kind(n));
        }

        const sourceItems = kids(sources);
        const head = sourceItems.length > 1 ? this.printFixpointList(keyword, sourceItems) : this.seq([keyword, sources], kind(n));
        if (clauses.length === 0) return head;
        if (!isQuery) {
            const [clauseKeyword, ...items] = clauses;
            const tail = this.printFixpointList(this.ls(clauseKeyword as TerminalNode), items);
            return group([head, indent([this.after(lastTerm(sources), line), tail])]);
        }

        const body = clauses.map((clause, index) => {
            const [clauseKeyword, ...items] = kids(this.ls(clause));
            const content = isTerm(clauseKeyword) && ttype(clauseKeyword) === L.FROM && items.length > 1
                ? this.printFixpointList(clauseKeyword, items)
                : this.print(clause);
            return [index === 0 ? "" : this.after(lastTerm(clauses[index - 1]), line), group(content)];
        });
        // Break at the whole query's boundary first. The clauses can still
        // share a line after moving to an indented continuation.
        return group([head, indent([this.after(lastTerm(sources), line), group(body)])]);
    }

    private printFixpointList(keyword: TerminalNode, nodes: Node[]): Doc {
        const { items, seps } = this.splitOn(nodes, L.COMMA);
        const entries = items.map(([item], i) => {
            const comma = seps[i];
            const end = lastTerm(item);
            return [
                this.print(this.ls(item)),
                comma ? this.separatorTok(end, comma) : "",
                comma ? this.after(end, this.after(comma, line)) : "",
            ];
        });
        return [this.tok(keyword), group(indent([this.after(keyword, line), entries]))];
    }

    private printConstraint(n: ParserRuleContext): Doc {
        const children = kids(n);
        const [head, implication] = children;
        if (this.flat > 0 || !isTerm(implication) || ttype(implication) !== L.COLON_MINUS) {
            return this.seq(children, kind(n));
        }
        const dot = children[children.length - 1] as TerminalNode;
        const { items, seps } = this.splitOn(children.slice(2, -1), L.COMMA);
        const vertical = items.length > 1 && items.every(([predicate]) => this.onNewLine(firstTerm(predicate)));
        const bodyBreak = vertical ? hardline : line;
        const predicates = items.map((item, i) => {
            const predicate = item[0];
            const end = lastTerm(predicate);
            const comma = seps[i];
            return [
                this.print(this.ls(predicate)),
                comma ? this.separatorTok(end, comma) : "",
                this.after(end, comma ? this.after(comma, bodyBreak) : ""),
            ];
        });
        return group([
            this.seq([head, implication], kind(n)),
            indent([this.after(implication, bodyBreak), group([predicates, this.tok(dot)])]),
        ]);
    }

    private printRunWith(n: ParserRuleContext): Doc {
        const children = kids(n);
        const k = kind(n);
        if (this.flat > 0 || children.length === 2) return this.seq(children, k);

        const [runKeyword, body, firstWith, firstHandler] = children;
        const head = this.seq([runKeyword, body], k);
        const bodyEnd = lastTerm(body);
        const ownLineComment = isTerm(firstWith) && (this.info(firstWith)?.lead[0]?.nl ?? 0) > 0;
        const hasBlock = this.isBlockExpr(body);
        const canAttach = hasBlock && bodyEnd !== null && !this.hasLineTrail(bodyEnd) && !ownLineComment;
        if (canAttach && kind(firstHandler) === "ApplyExpr") {
            const args = kids(kids(firstHandler)[1]);
            const [open, argument] = args;
            if (args.length === 3 && isTerm(open) && kids(argument).length === 1 && kind(kids(argument)[0]) === "ApplyExpr") {
                this.handlerArgumentOpeners.add(open.symbol.tokenIndex);
            }
        }
        const firstClause = this.seq([this.ls(firstWith), firstHandler], k);
        const rest: Doc[] = [];
        for (let i = 4; i < children.length; i += 2) {
            const [withKeyword, handler] = children.slice(i, i + 2);
            rest.push(hardline, this.seq([this.ls(withKeyword), handler], k));
        }
        if (!canAttach) {
            if (rest.length === 0 && !hasBlock && bodyEnd && !this.hasLineTrail(bodyEnd) && !ownLineComment) {
                return group([head, line, firstClause]);
            }
            return [head, hardline, firstClause, rest];
        }

        // Keep the keyword with the closing brace and let the handler wrap internally.
        // Later clauses start under the first `with` in `} with`.
        return [head, " ", firstClause, align(2, rest)];
    }

    private alignMatchRules(rules: Node[], layoutId: symbol): Doc[] | undefined {
        if (this.flat > 0 || rules.length < 2 || !rules.every((rule) => kind(rule) === "MatchRule")) return;
        return this.alignmentGroups(rules, firstTerm).flatMap((group) => this.alignMatchGroup(group, layoutId));
    }

    private alignMatchGroup(rules: Node[], layoutId: symbol): Doc[] {
        const rows = rules.map((rule) => {
            this.ls(rule);
            const leading = this.takeLeadingOwnLineComments(firstTerm(rule));
            return { leading, ...this.eqBodyDocs(rule as ParserRuleContext) };
        });
        const options = { printWidth: this.printWidth, tabWidth: this.tabWidth };
        const measure = (value: Doc): number => {
            const { formatted } = doc.printer.printDocToString(value, options);
            return formatted.includes("\n") ? Infinity : util.getStringWidth(formatted);
        };
        const widths = rows.map(({ head }) => measure(head));
        const column = Math.max(...widths);
        if (!Number.isFinite(column) || widths.every((width) => width === column)) {
            return rows.map(({ leading, head, gap, tail }) => [leading, head, gap, tail]);
        }
        // A multiline body can start below its arrow. If every arm would
        // otherwise fit, don't introduce a wrap just to align the arrows.
        const armWidths = rows.map(({ head, gap, tail }) => measure([head, gap, tail]) + 2 * this.tabWidth);
        const allStayCompact = armWidths.every((width, i) => width + column - widths[i] <= this.printWidth);
        const hasWrappedArm = armWidths.some((width) => width > this.printWidth);
        const modestPadding = widths.every((width) => column - width <= 16);
        const fits = column + " =>".length + 2 * this.tabWidth <= this.printWidth &&
            rows.every(({ gap }) => gap === " ") && (allStayCompact || (hasWrappedArm && modestPadding));
        return rows.map(({ leading, head, gap, tail }, i) => [
            leading,
            head,
            fits ? ifBreak(" ".repeat(column - widths[i] + 1), gap, { groupId: layoutId }) : gap,
            tail,
        ]);
    }

    /** Places `body` after `arrow`: hugged on the arrow's line when it spans lines, else wrapped. */
    private placeBody(body: Node, arrow: TerminalNode): Doc {
        const f = firstTerm(body);
        const l = lastTerm(body);
        const sameLine = !!f && f.symbol.line === arrow.symbol.line;
        // Hug when the author kept the body on the arrow's line and it closes with a brace.
        if (sameLine && l !== null && ttype(l) === L.RBRACE) return [this.after(arrow, " ", true), this.print(body)];
        if (this.flat === 0 && kind(body) === "ParYieldExpr" && ttype(arrow) === L.EQUAL &&
            !this.hasLineTrail(arrow) && f && !this.hasComment(f, true)) {
            return this.printParYield(body as ParserRuleContext, true);
        }
        const d = this.print(this.ls(body));
        if (sameLine && willBreak(d)) return [this.after(arrow, " ", true), d];
        return group(indent([this.after(arrow, line), d]));
    }

    /** `head = body`, `case p => body`, `x -> body`; `let` and local `def` own the rest of their block. */
    private printEqBody(n: ParserRuleContext): Doc {
        const { head, gap, tail } = this.eqBodyDocs(n);
        return [head, gap, tail];
    }

    private eqBodyDocs(n: ParserRuleContext): { head: Doc; gap: Doc; tail: Doc } {
        const cs = kids(n);
        const k = kind(n);
        const ai = cs.findIndex((c) => isTerm(c) && BODY_ARROWS.has(ttype(c)));
        const arrow = cs[ai] as TerminalNode;
        const headLast = ai > 0 ? lastTerm(cs[ai - 1]) : null;
        const head = k === "DefDeclaration" ? this.printDefinitionHead(n, cs, ai) : this.seq(cs.slice(0, ai), k);
        const gap = this.after(headLast, " ", true);
        return { head, gap, tail: [this.tok(arrow), this.printEqBodyTail(cs, ai, k, arrow)] };
    }

    private printDefinitionHead(n: ParserRuleContext, children: Node[], arrowIndex: number): Doc {
        const head = children.slice(0, arrowIndex);
        const typeIndex = head.findIndex((child) => kind(child) === "TypeAndEffect");
        const type = typeIndex < 0 ? undefined : kids(head[typeIndex])[0];
        const schema = type && kind(type) === "SimpleType" ? kids(type)[0] : undefined;
        if (!schema || kind(schema) !== "SchemaType") return this.printSignature(n, head, " =");
        const parts = kids(schema);
        const { items, seps } = this.splitOn(parts.slice(1, -1), L.COMMA);
        const first = firstTerm(n)!;
        const last = lastTerm(schema)!;
        if (items.length < 2) return this.seq(head, kind(n));
        for (let index = first.symbol.tokenIndex; index <= last.symbol.tokenIndex; index++) {
            const info = this.root.info.get(index);
            if (info && (info.lead.length || info.trail.length)) return this.seq(head, kind(n));
        }

        const prefix = this.seq(head.slice(0, typeIndex), kind(n));
        const fallback = this.print(schema);
        const suffix = this.seq(head.slice(typeIndex + 1), kind(n));
        const withSuffix: Doc[] = typeIndex === head.length - 1 ? [] : [" ", suffix];
        const ordinary = [prefix, " ", fallback, ...withSuffix];
        const open = this.tok(parts[0] as TerminalNode);
        const close = this.tok(parts[parts.length - 1] as TerminalNode);
        const rows = items.map((item, i) => [this.seq(item, "SchemaType"), seps[i] ? this.tok(seps[i]) : ""]);
        const render = (value: Doc): string => doc.printer.printDocToString(
            value, { printWidth: this.printWidth, tabWidth: this.tabWidth },
        ).formatted;
        const prefixText = render([prefix, " ", open, " "]);
        const rowTexts = rows.map(render);
        const lastRowSuffix = render([" ", close, ...withSuffix]);
        if ([prefixText, ...rowTexts, lastRowSuffix].some((text) => text.includes("\n"))) return ordinary;

        const body = firstTerm(children[arrowIndex + 1]);
        const bodyOpener = body && ttype(body) === L.HASH_LBRACE ? " #{" : "";
        const column = util.getStringWidth(prefixText);
        const available = this.printWidth - this.declarationIndent(n) - column;
        const endWidth = util.getStringWidth(lastRowSuffix + " =" + bodyOpener);
        const widths = rowTexts.map(util.getStringWidth);
        const compactWidth = widths.reduce((sum, width) => sum + width, rows.length - 1) + endWidth;
        if (compactWidth <= available || widths.some((width, i) =>
            width + (i === rows.length - 1 ? endWidth : 0) > available)) return ordinary;

        return [
            prefix, " ", open, " ", rows[0],
            align(column, [hardline, join(hardline, rows.slice(1))]),
            " ", close, ...withSuffix,
        ];
    }

    private printWithClause(n: ParserRuleContext): Doc {
        const children = kids(n);
        if (this.flat > 0 || children.length < 4) return this.seq(children, kind(n));

        const [keyword, ...constraints] = children;
        const { items, seps } = this.splitOn(constraints, L.COMMA);
        const rows = items.map(([constraint], index) => {
            const separator = seps[index];
            const end = lastTerm(constraint);
            return [
                this.print(this.ls(constraint)),
                separator ? this.separatorTok(end, separator) : "",
                separator ? this.after(end, this.after(separator, line)) : "",
            ];
        });
        return [this.print(keyword), group(indent([this.after(lastTerm(keyword), line), rows]))];
    }

    private declarationIndent(n: ParserRuleContext): number {
        let indentation = 0;
        for (let parent = n.parent; parent; parent = parent.parent) {
            if (DECLARATION_BLOCKS.has(kind(parent as Node))) indentation += this.tabWidth;
        }
        return indentation;
    }

    private printSignature(n: ParserRuleContext, children: Node[], suffix = ""): Doc {
        const parentKind = kind(n);
        const typeIndex = children.findIndex((child) => kind(child) === "TypeAndEffect");
        if (this.flat > 0 || typeIndex < 0) return this.seq(children, parentKind);
        const type = kids(children[typeIndex])[0];
        const clauses = children.slice(typeIndex + 1);
        const hasEffect = kind(type) === "EffectAnnotatedType";
        if (!hasEffect && clauses.length === 0 && kind(type) !== "ApplyType") return this.seq(children, parentKind);
        const first = firstTerm(n)!;
        const last = lastTerm(children[children.length - 1])!;
        for (let index = first.symbol.tokenIndex; index <= last.symbol.tokenIndex; index++) {
            const info = this.root.info.get(index);
            if (info && (info.trail.length || (index !== first.symbol.tokenIndex && info.lead.length))) {
                return this.seq(children, parentKind);
            }
        }

        const [result, slash, effect] = hasEffect ? kids(type) : [type];
        const prefix = this.seq(children.slice(0, typeIndex), parentKind);
        const parts: Doc[] = [this.print(result)];
        if (hasEffect) parts.push(this.seq([slash, effect], "EffectAnnotatedType"));
        parts.push(...clauses.map((clause) => this.print(clause)));
        const ordinary: Doc = [prefix, " ", join(" ", parts)];

        const width = this.printWidth - this.declarationIndent(n);
        const options = { printWidth: Math.max(1, width), tabWidth: this.tabWidth };
        const render = (value: Doc): string => doc.printer.printDocToString(value, options).formatted;
        const rows = parts.map(render);
        if (rows.some((row) => row.includes("\n"))) return ordinary;
        const prefixWidth = util.getStringWidth(render(prefix).split("\n").at(-1)!);
        if (prefixWidth + 1 + util.getStringWidth(rows.join(" ") + suffix) <= width) return ordinary;

        // Prefer breaking at the outer clause, then the effect, then the result
        // type. Keep individual parts compact if they fit on the continuation.
        for (let i = parts.length - 1; i >= 0; i--) {
            const left = i === 0 ? "" : " " + rows.slice(0, i).join(" ");
            const right = rows.slice(i).join(" ") + suffix;
            if (prefixWidth + util.getStringWidth(left) > width ||
                this.tabWidth + util.getStringWidth(right) > width) continue;
            return [prefix, i === 0 ? "" : [" ", join(" ", parts.slice(0, i))], indent([hardline, join(" ", parts.slice(i))])];
        }
        return ordinary;
    }

    private printEqBodyTail(cs: Node[], ai: number, k: string, arrow: TerminalNode): Doc {
        const body = cs[ai + 1];
        const rest = cs.slice(ai + 2);
        const restDoc = rest.length > 0 ? this.seq(rest, k) : "";
        const comma = rest.length > 0 && isTerm(rest[0]) && ttype(rest[0] as TerminalNode) === L.COMMA;
        const tailDoc: Doc = rest.length > 0 ? (comma ? restDoc : [" ", restDoc]) : "";

        if (kind(body) !== "Statement") return [this.placeBody(body, arrow), tailDoc];

        const stmt = body as ParserRuleContext;
        const parts = this.statementParts(stmt);
        if (k === "LetExpr" || k === "LocalDefExpr") {
            // The statement is the remainder of the enclosing block: only its first expression
            // belongs to this binding.
            const first = parts[0];
            const out: Doc[] = [this.placeBody(first.expr, arrow)];
            if (first.semi) out.push(this.separatorTok(lastTerm(first.expr), first.semi));
            if (parts.length > 1) out.push(hardline, ...this.restSeparator(parts[1].expr), ...this.printParts(parts, 1));
            return [out, tailDoc];
        }
        if (this.isMultiStatement(stmt)) return [indent([hardline, this.printStatement(stmt)]), tailDoc];
        const only = parts[0];
        const out: Doc[] = [this.placeBody(only.expr, arrow)];
        if (only.semi) out.push(this.separatorTok(lastTerm(only.expr), only.semi));
        return [out, tailDoc];
    }

    private restSeparator(next: Node): Doc[] {
        return this.blankBefore(firstTerm(next)) ? [hardline] : [];
    }

    // --------------------------------------------------------------- operators

    private printArrowType(n: ParserRuleContext): Doc {
        const children = kids(n);
        if (this.flat > 0) return this.seq(children, "ArrowType");

        const [first, arrow, result] = children;
        // An inline type after a signature prefix needs a hanging indent.
        const firstToken = firstTerm(first);
        const atLineStart = firstToken !== null && this.lineStart.has(firstToken.symbol.tokenIndex);
        const head = this.seq([first, arrow], "ArrowType");
        const continuation: Doc[] = [];
        let previousArrow = arrow;
        let rest = result;
        // Flix associates arrow types to the right. Parenthesized types and
        // effect annotations keep their own layout.
        while (kind(rest) === "ArrowType") {
            const [parameter, nextArrow, remaining] = kids(rest);
            continuation.push(
                this.after(lastTerm(previousArrow), line),
                this.seq([this.ls(parameter), nextArrow], "ArrowType"),
            );
            previousArrow = nextArrow;
            rest = remaining;
        }
        continuation.push(indent([this.after(lastTerm(previousArrow), line), this.print(this.ls(rest))]));
        // `placeBody` keeps a type that a comment breaks on the line of its `=`.
        const previous = firstToken === null ? null : prevTerm(firstToken);
        const hugged = previous !== null && BODY_ARROWS.has(ttype(previous)) &&
            previous.symbol.line === firstToken!.symbol.line &&
            willBreak([head, continuation]);
        // A head that breaks inside its own brackets keeps a fitting rest on its last line.
        return group([head, group(atLineStart && !hugged ? continuation : indent(continuation))]);
    }

    private printBinary(n: ParserRuleContext): Doc {
        const k = kind(n);
        const rightAssoc = k === "ConsExpr";
        const operands: Node[] = [];
        const ops: Node[] = [];
        const isPipe = (operator: Node): boolean =>
            k === "UserOpExpr" && isTerm(operator) && ["|>", "!>"].includes(this.src(operator));
        const collect = (m: ParserRuleContext): void => {
            const [l, op, r] = kids(m);
            if (rightAssoc) {
                operands.push(l);
                ops.push(op);
                if (kind(r) === k) collect(r as ParserRuleContext);
                else operands.push(r);
            } else {
                if (kind(l) === k && isPipe(kids(l)[1]) === isPipe(op)) collect(l as ParserRuleContext);
                else operands.push(l);
                ops.push(op);
                operands.push(r);
            }
        };
        collect(n);
        const firstToken = firstTerm(operands[0]);
        const isPipeline = isPipe(ops[0]);
        if (isPipeline) {
            const leading = this.takeLeadingOwnLineComments(firstToken);
            const first = this.print(operands[0]);
            const breakPoint = this.flat > 0 ? " " : line;
            const steps = ops.map((op, i) => [
                this.after(lastTerm(operands[i]), breakPoint),
                this.print(this.ls(op)),
                this.after(lastTerm(op), " "),
                this.print(operands[i + 1]),
            ]);
            return [leading, group([first, indent(steps)])];
        }

        const links = ops.map((op, i) => {
            const tightCons = isTerm(op) && ttype(op) === L.COLON_COLON_TIGHT;
            // Multiline list constructors follow the leading :: style in the Flix examples.
            const leadingCons = rightAssoc && isTerm(op) && ttype(op) === L.COLON_COLON;
            const breakPoint = this.flat > 0 ? " " : line;
            const hasOwnLineComment = leadingCons && (this.info(op)?.lead[0]?.nl ?? 0) > 0;
            const before = hasOwnLineComment ? hardline : leadingCons ? breakPoint : " ";
            const after = leadingCons ? " " : breakPoint;
            return {
                operator: [
                    this.after(lastTerm(operands[i]), tightCons ? "" : before), this.print(leadingCons ? this.ls(op) : op),
                ],
                after: this.after(lastTerm(op), tightCons ? "" : after),
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
