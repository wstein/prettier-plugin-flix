import type { CharStream, Lexer, Parser } from "antlr4ng";
import type { FlixGrammarId } from "./flix-version.js";
import { grammar79 } from "./grammar-079.js";
import { grammar80 } from "./grammar-080.js";

/** Constructor + static token type constants for a generated Flix lexer. */
export type FlixLexerClass = {
    new (input: CharStream): Lexer;
    readonly EOF: number;
    readonly WS: number;
    readonly LINE_COMMENT: number;
    readonly DOC_COMMENT: number;
    readonly BLOCK_COMMENT: number;
    readonly STRING_CONTENT: number;
    readonly STRING_START: number;
    readonly STRING_END: number;
    readonly INTERPOLATION_START: number;
    readonly INTERPOLATION_END: number;
    readonly DEBUG_INTERPOLATOR: number;
    readonly COMMA: number;
    readonly SEMI: number;
    readonly COLON: number;
    readonly LPAREN: number;
    readonly RPAREN: number;
    readonly LBRACK: number;
    readonly RBRACK: number;
    readonly LBRACE: number;
    readonly RBRACE: number;
    readonly DOT: number;
    readonly DOT_WS: number;
    readonly FREE_DOT: number;
    readonly EQUAL: number;
    readonly ARROW_TIGHT: number;
    readonly ARROW_WS: number;
    readonly ARROW_THICK_R: number;
    readonly COLON_COLON: number;
    readonly COLON_COLON_TIGHT: number;
    readonly COLON_COLON_COLON: number;
    readonly COLON_MINUS: number;
    readonly HASH_LBRACE: number;
    readonly HASH_LPAREN: number;
    readonly HASH_BAR: number;
    readonly BAR_HASH: number;
    readonly ARRAY_HASH: number;
    readonly LIST_HASH: number;
    readonly MAP_HASH: number;
    readonly SET_HASH: number;
    readonly VECTOR_HASH: number;
    readonly NAME_LOWERCASE: number;
    readonly NAME_UPPERCASE: number;
    readonly NAME_MATH: number;
    readonly STATIC_UPPER: number;
    readonly ANNOTATION: number;
    readonly HOLE_NAMED: number;
    readonly HOLE_VARIABLE: number;
    readonly SUPER: number;
    readonly CHECKED_CAST: number;
    readonly CHECKED_ECAST: number;
    readonly UNCHECKED_CAST: number;
    readonly ANGLE_L: number;
    readonly ANGLE_R: number;
    readonly PLUS: number;
    readonly MINUS: number;
    readonly SLASH: number;
    readonly BAR: number;
    readonly HASH: number;
    readonly TILDE: number;
    readonly BACKTICK: number;
    readonly IF: number;
    readonly FROM: number;
    readonly INJECT: number;
    readonly QUERY: number;
    readonly SOLVE: number;
    readonly PQUERY: number;
    readonly PSOLVE: number;
    readonly TRUE: number;
    readonly FALSE: number;
    readonly NULL: number;
    readonly INT_LITERAL: number;
    readonly FLOAT_LITERAL: number;
    readonly HEX_LITERAL: number;
    readonly CHAR_LITERAL: number;
    readonly REGEX_LITERAL: number;
    readonly USE: number;
    readonly IMPORT: number;
    readonly DEF: number;
    readonly REDEF: number;
    /** Present on Flix 0.80+; absent on 0.79. */
    readonly VAL?: number;
    readonly MOD: number;
    readonly ENUM: number;
    readonly STRUCT: number;
    readonly TRAIT: number;
    readonly INSTANCE: number;
    readonly EFF: number;
    readonly TYPE: number;
    readonly CASE: number;
    readonly PUB: number;
    readonly SEALED: number;
    readonly MUT: number;
    readonly RESTRICTABLE: number;
    readonly symbolicNames: (string | null)[];
};

type Ctx = abstract new (...args: never[]) => object;

export type FlixGrammar = {
    id: FlixGrammarId;
    Lexer: FlixLexerClass;
    Parser: {
        new (input: import("antlr4ng").TokenStream): Parser & {
            compilationUnit(): import("antlr4ng").ParserRuleContext;
        };
        readonly ruleNames: string[];
    };
    DeclarationContext: Ctx;
    DefDeclarationContext: Ctx;
    HandlerExprContext: Ctx;
    DotContext: Ctx;
    ModDeclarationContext: Ctx;
    ConstraintSetContext: Ctx;
    EnumDeclarationTailContext: Ctx;
    StructDeclarationContext: Ctx;
    UsesOrImportsContext: Ctx;
};

const GRAMMARS: Record<FlixGrammarId, FlixGrammar> = {
    "flix-0.79.0": grammar79,
    "flix-0.80.0": grammar80,
};

/** Resolve a generated lexer/parser bundle for a grammar id. */
export function grammarForId(id: FlixGrammarId): FlixGrammar {
    return GRAMMARS[id];
}
