// Pulls Flix code blocks out of Markdown (issue bodies and comments).

/**
 * Returns the fenced code blocks of `markdown` that can hold Flix: tagged `flix`, untagged, or
 * tagged `scala` (GitHub highlights Flix as Scala, so issue authors often use that tag).
 * Fences of three or more backticks or tildes are supported; the closing fence must be at least
 * as long as the opening one. Blocks tagged with another language (bash, json, ...) are skipped.
 */
export function extractFlixBlocks(markdown) {
    const blocks = [];
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        const open = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/.exec(lines[i]);
        if (!open) continue;
        const fence = open[1];
        const lang = open[2].toLowerCase();
        let end = i + 1;
        while (end < lines.length && !new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(lines[end])) end++;
        if (end >= lines.length) break; // unclosed: not a block
        if (lang === "" || lang === "flix" || lang === "scala") {
            const code = lines.slice(i + 1, end).join("\n").trim();
            if (code !== "") blocks.push({ lang, code, line: i + 1 });
        }
        i = end;
    }
    return blocks;
}
