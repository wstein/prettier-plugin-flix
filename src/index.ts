import type { AstPath, Doc, Options, Parser, Plugin, Printer, SupportLanguage } from "prettier";
import { alignmentIndents, layoutSource } from "./comment-layout.js";
import { parseFlix, type FlixRoot } from "./parse.js";
import { Printer as FlixPrinter } from "./print.js";

export const languages: SupportLanguage[] = [
    {
        name: "Flix",
        parsers: ["flix"],
        extensions: [".flix"],
        vscodeLanguageIds: ["flix"],
        linguistLanguageId: 800935960,
    },
];

const flixParser: Parser<FlixRoot> = {
    parse: (text: string) => parseFlix(text),
    astFormat: "flix-ast",
    locStart: (node: FlixRoot) => node.start,
    locEnd: (node: FlixRoot) => node.end,
};

export const parsers: Record<string, Parser<FlixRoot>> = { flix: flixParser };

// Flix uses four-space indentation and a 100-column line width by default.
export const defaultOptions = { tabWidth: 4, printWidth: 100 };

const flixAstPrinter: Printer<FlixRoot> = {
    // The whole tree is printed from the root: comments and blank lines are read from the
    // token stream, so Prettier's own comment attachment is not used.
    print(path: AstPath<FlixRoot>, options: Options): Doc {
        const { printWidth = defaultOptions.printWidth, tabWidth = defaultOptions.tabWidth, useTabs = false } = options;
        const settings = { printWidth, tabWidth, useTabs };
        const printer = new FlixPrinter(path.node, printWidth, tabWidth);
        let value = printer.printRoot();
        if (printer.hasAlignmentCandidates) {
            const indents = alignmentIndents(path.node, value, settings);
            if (indents.size) value = new FlixPrinter(path.node, printWidth, tabWidth, indents).printRoot();
        }
        return layoutSource(path.node, value, settings);
    },
};

export const printers: Record<string, Printer<FlixRoot>> = { "flix-ast": flixAstPrinter };

const plugin: Plugin<FlixRoot> = { languages, parsers, printers, defaultOptions };
export { recoverFormatting } from "./recover.js";
export default plugin;
