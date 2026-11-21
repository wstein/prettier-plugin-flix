import type { Parser, Plugin, Printer, SupportLanguage, SupportOptions } from "prettier";

/** Exact Flix compiler versions the plugin can parse today. */
export const SUPPORTED_FLIX_VERSIONS: readonly ["0.80.0"];
export type FlixVersion = (typeof SUPPORTED_FLIX_VERSIONS)[number];
export const DEFAULT_FLIX_VERSION: FlixVersion;
export type FlixGrammarId = "flix-0.80.0";

export function resolveFlixVersion(value: unknown): FlixVersion;
export function grammarIdForVersion(version: FlixVersion): FlixGrammarId;

/** Public layout options accepted by `recoverFormatting`. */
export type RecoverLayout = {
    printWidth: number;
    tabWidth: number;
    useTabs: boolean;
    endOfLine?: "lf";
    flixVersion?: string;
};

/** Formatter callback used to print independently recoverable slices. */
export type RecoverFormat = (source: string, options: RecoverLayout) => Promise<string>;

export const languages: SupportLanguage[];
export const parsers: Record<string, Parser>;
export const printers: Record<string, Printer>;
export const options: SupportOptions;
export const defaultOptions: { tabWidth: number; printWidth: number };

/** Keep invalid text intact and print only independently parseable source ranges. */
export function recoverFormatting(
    source: string,
    layout: RecoverLayout,
    format: RecoverFormat,
): Promise<string | undefined>;

declare const plugin: Plugin;
export default plugin;
