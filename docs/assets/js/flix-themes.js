import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";

// Match the Flix website's Plus palettes and unified keyword colors.
// https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/components/CodeSnippet.astro
export const flixThemes = Object.fromEntries([
    ["light", lightPlus, "#AF00DB"],
    ["dark", darkPlus, "#C586C0"],
].map(([mode, theme, foreground]) => [mode, {
    ...theme,
    name: `${theme.name}-flix`,
    tokenColors: [...theme.tokenColors, {
        scope: ["keyword", "storage", "storage.modifier"],
        settings: { foreground },
    }],
}]));
