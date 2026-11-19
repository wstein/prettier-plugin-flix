import { Chunk } from "@codemirror/merge";
import { Text } from "@codemirror/state";
import { flixTokenStyle } from "./playground-editor.js";

export function renderDiff(container, { source, output }, tokenize) {
    if (source === output) {
        const message = document.createElement("p");
        message.className = "playground-diff-empty";
        message.textContent = "No formatting changes.";
        container.replaceChildren(message);
        return;
    }

    const before = Text.of(source.split("\n"));
    const after = Text.of(output.split("\n"));
    const chunks = Chunk.build(before, after, { scanLimit: 500, timeout: 50 });
    const beforeTokens = tokenize?.(source);
    const afterTokens = tokenize?.(output);
    const listing = document.createElement("pre");
    listing.className = "playground-diff-code";
    const lines = document.createDocumentFragment();

    function appendLines(doc, tokens, from, to, kind) {
        if (from >= to) return;
        for (let number = doc.lineAt(from).number; number <= doc.lines; number++) {
            const line = doc.line(number);
            if (line.from >= to || (line.from === doc.length && !line.text)) break;
            const row = document.createElement("span");
            row.className = `diff-line diff-${kind}`;

            const marker = document.createElement("span");
            marker.className = "diff-marker";
            marker.textContent = kind === "removed" ? "−" : kind === "added" ? "+" : " ";
            if (kind === "unchanged") marker.setAttribute("aria-hidden", "true");
            row.append(marker);

            const code = document.createElement("span");
            const lineTokens = tokens?.[number - 1];
            if (lineTokens) {
                for (const token of lineTokens) {
                    const span = document.createElement("span");
                    span.className = "flix-token";
                    span.setAttribute("style", flixTokenStyle(token.variants));
                    span.textContent = token.content;
                    code.append(span);
                }
            } else {
                code.textContent = line.text;
            }
            if (kind !== "unchanged" && line.to === doc.length) {
                const ending = document.createElement("span");
                ending.className = "diff-ending";
                ending.textContent = "No newline at end of file";
                code.append(ending);
            }
            row.append(code);
            lines.append(row);
        }
    }

    let end = 0;
    for (const chunk of chunks) {
        appendLines(after, afterTokens, end, chunk.fromB, "unchanged");
        appendLines(before, beforeTokens, chunk.fromA, chunk.toA, "removed");
        appendLines(after, afterTokens, chunk.fromB, chunk.toB, "added");
        end = chunk.toB;
    }
    appendLines(after, afterTokens, end, after.length, "unchanged");

    listing.append(lines);
    container.replaceChildren(listing);
}
