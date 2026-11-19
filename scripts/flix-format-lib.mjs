// Pure logic of scripts/flix-format-references.mjs: diagnostics summaries, the comparison of saved
// and actual references, the validity gate, the exit code, diff output and the timeout. Nothing
// here touches the file system or starts Java, so test/flix-format-lib.test.mjs covers it directly.

export const normalize = (text) => text.replace(/\x1b\[[0-9;]*m/g, "").replace(/\r\n/g, "\n");

const HEADER = /^-- (.+? \[E\d+\]) -+[^\n]*$/;
const EXCERPT = /^\s*\d+ \|/; // a source excerpt line such as `12 | def f(): Int32 = 1`
const MARKER = /^\s*\^+\s*$/; // the caret line below an excerpt

/**
 * Summarizes the diagnostics printed by the Flix compiler, one `<header>: <message>` line each.
 *
 * Every block starts with a header line `-- <Kind> [E1234] ---- <file>`. The message is the first
 * line starting with `>>` in that block. Some errors (for example E6217 `Unused effect`, or the
 * `Unresolved constructor` family) print a highlighted source excerpt instead of a `>>` line; for
 * those the message is the first non-empty line that is neither a source excerpt line nor a caret
 * line. A block without any such line is summarized by its header alone. The number of summary
 * lines must equal the number of headers, and output without a header is an error, so a new
 * diagnostics layout can never be dropped silently.
 */
export function summarizeDiagnostics(output, label = "the compiler output") {
    const lines = normalize(output).split("\n");
    const blocks = [];
    for (const line of lines) {
        const header = HEADER.exec(line);
        if (header) blocks.push({ header: header[1], body: [] });
        else blocks.at(-1)?.body.push(line);
    }
    if (blocks.length === 0) throw new Error(`Unrecognized Flix diagnostics for ${label}:\n${normalize(output)}`);
    const summary = blocks.map(({ header, body }) => {
        const arrow = body.find((line) => line.startsWith(">>"));
        const message = arrow !== undefined
            ? arrow.slice(2)
            : body.find((line) => line.trim() !== "" && !EXCERPT.test(line) && !MARKER.test(line)) ?? "";
        return message.trim() === "" ? `${header}\n` : `${header}: ${message.trim()}\n`;
    });
    const headers = lines.filter((line) => HEADER.test(line)).length;
    if (summary.length !== headers) {
        throw new Error(`Flix diagnostics for ${label}: ${summary.length} summaries for ${headers} headers`);
    }
    return summary.join("");
}
