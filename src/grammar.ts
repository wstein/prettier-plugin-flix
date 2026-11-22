import type { CharStream, Lexer, Parser } from "antlr4ng";
import type { FlixGrammarId } from "./flix-version.js";
import { FlixLexer as Lexer79 } from "./generated/flix-0.79.0/FlixLexer.js";
import {
    ConstraintSetContext as ConstraintSet79,
    DeclarationContext as Declaration79,
    DotContext as Dot79,
    EnumDeclarationTailContext as EnumTail79,
    FlixParser as Parser79,
    ModDeclarationContext as Mod79,
    StructDeclarationContext as Struct79,
    UsesOrImportsContext as Uses79,
} from "./generated/flix-0.79.0/FlixParser.js";
import { FlixLexer as Lexer80 } from "./generated/flix-0.80.0/FlixLexer.js";
import {
    ConstraintSetContext as ConstraintSet80,
    DeclarationContext as Declaration80,
    DefDeclarationContext as Def80,
    DotContext as Dot80,
    EnumDeclarationTailContext as EnumTail80,
    FlixParser as Parser80,
    HandlerExprContext as Handler80,
    ModDeclarationContext as Mod80,
    StructDeclarationContext as Struct80,
    UsesOrImportsContext as Uses80,
} from "./generated/flix-0.80.0/FlixParser.js";
import {
    DefDeclarationContext as Def79,
    HandlerExprContext as Handler79,
} from "./generated/flix-0.79.0/FlixParser.js";

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
    "flix-0.79.0": {
        id: "flix-0.79.0",
        Lexer: Lexer79 as unknown as FlixLexerClass,
        Parser: Parser79 as unknown as FlixGrammar["Parser"],
        DeclarationContext: Declaration79,
        DefDeclarationContext: Def79,
        HandlerExprContext: Handler79,
        DotContext: Dot79,
        ModDeclarationContext: Mod79,
        ConstraintSetContext: ConstraintSet79,
        EnumDeclarationTailContext: EnumTail79,
        StructDeclarationContext: Struct79,
        UsesOrImportsContext: Uses79,
    },
    "flix-0.80.0": {
        id: "flix-0.80.0",
        Lexer: Lexer80 as unknown as FlixLexerClass,
        Parser: Parser80 as unknown as FlixGrammar["Parser"],
        DeclarationContext: Declaration80,
        DefDeclarationContext: Def80,
        HandlerExprContext: Handler80,
        DotContext: Dot80,
        ModDeclarationContext: Mod80,
        ConstraintSetContext: ConstraintSet80,
        EnumDeclarationTailContext: EnumTail80,
        StructDeclarationContext: Struct80,
        UsesOrImportsContext: Uses80,
    },
};

/** Load the generated lexer/parser bundle for a grammar id. */
export function grammarForId(id: FlixGrammarId): FlixGrammar {
    return GRAMMARS[id];
}

/** Default grammar used by tooling that has not selected a Flix version. */
export function defaultGrammar(): FlixGrammar {
    return GRAMMARS["flix-0.80.0"];
}
