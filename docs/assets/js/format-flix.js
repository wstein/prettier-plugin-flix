import { format } from "prettier/standalone";
import flix, { defaultOptions, recoverFormatting } from "prettier-plugin-flix";
import { loadFormatterGrammar } from "./browser-grammar.js";

export { loadFormatterGrammar };

export async function formatFlix(source, options) {
    await loadFormatterGrammar(options);
    return format(source, { ...options, parser: "flix", plugins: [flix] });
}

export async function formatFlixPreview(source, options) {
    try {
        return { output: await formatFlix(source, options) };
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        const output = await recoverFormatting(source, { ...defaultOptions, useTabs: false, ...options }, formatFlix);
        return { output, error: { message: error.message, location: error.loc?.start } };
    }
}
