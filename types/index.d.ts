import type { Parser, Plugin, Printer, SupportLanguage } from "prettier";

/** Public layout options accepted by `recoverFormatting`. */
export type RecoverLayout = {
    printWidth: number;
    tabWidth: number;
    useTabs: boolean;
    endOfLine?: "lf";
};

/** Formatter callback used to print independently recoverable slices. */
export type RecoverFormat = (source: string, options: RecoverLayout) => Promise<string>;

export const languages: SupportLanguage[];
export const parsers: Record<string, Parser>;
export const printers: Record<string, Printer>;
export const defaultOptions: { tabWidth: number; printWidth: number };

/** Keep invalid text intact and print only independently parseable source ranges. */
export function recoverFormatting(
    source: string,
    layout: RecoverLayout,
    format: RecoverFormat,
): Promise<string | undefined>;

declare const plugin: Plugin;
export default plugin;
