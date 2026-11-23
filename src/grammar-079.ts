import type { FlixGrammar, FlixLexerClass } from "./grammar.js";
import { FlixLexer } from "./generated/flix-0.79.0/FlixLexer.js";
import {
    ConstraintSetContext,
    DeclarationContext,
    DefDeclarationContext,
    DotContext,
    EnumDeclarationTailContext,
    FlixParser,
    HandlerExprContext,
    ModDeclarationContext,
    StructDeclarationContext,
    UsesOrImportsContext,
} from "./generated/flix-0.79.0/FlixParser.js";

export const grammar79: FlixGrammar = {
    id: "flix-0.79.0",
    Lexer: FlixLexer as unknown as FlixLexerClass,
    Parser: FlixParser as unknown as FlixGrammar["Parser"],
    ConstraintSetContext,
    DeclarationContext,
    DefDeclarationContext,
    DotContext,
    EnumDeclarationTailContext,
    HandlerExprContext,
    ModDeclarationContext,
    StructDeclarationContext,
    UsesOrImportsContext,
};
