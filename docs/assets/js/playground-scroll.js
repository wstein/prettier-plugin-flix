import { buildDiffChunks } from "./playground-diff.js";

function lineIndex(doc, position) {
    // A chunk may end one position past the document when it includes its last line.
    return position > doc.length ? doc.lines : doc.lineAt(position).number - 1;
}

function mapLine(line, changes, from, to) {
    let offset = 0;
    for (const change of changes) {
        const [start, end] = change[from];
        const [targetStart, targetEnd] = change[to];
        if (line < start) break;
        if (line < end) {
            return targetStart + (line - start) * (targetEnd - targetStart) / (end - start);
        }
        offset = targetEnd - end;
    }
    return line + offset;
}

export function linkEditorScroll(input, output, canSync) {
    const views = [input, output];
    const lastTop = views.map((view) => view.scrollDOM.scrollTop);
    let documents;
    let changes;

    function sync(from) {
        const to = 1 - from;
        const source = views[from];
        const target = views[to];
        if (!canSync() || !target.scrollDOM.clientHeight) return;

        const current = views.map((view) => view.state.doc);
        if (!documents || current.some((doc, index) => doc !== documents[index])) {
            documents = current;
            const [before, after] = documents;
            changes = buildDiffChunks(before, after).map((chunk) => [
                [lineIndex(before, chunk.fromA), lineIndex(before, chunk.toA)],
                [lineIndex(after, chunk.fromB), lineIndex(after, chunk.toB)],
            ]);
        }

        const height = Math.max(0, source.scrollDOM.scrollTop - source.documentPadding.top);
        const block = source.lineBlockAtHeight(height);
        const line = lineIndex(source.state.doc, block.from) + (height - block.top) / block.height;
        const mapped = Math.max(0, Math.min(target.state.doc.lines - 1, mapLine(line, changes, from, to)));
        const index = Math.floor(mapped);
        const targetBlock = target.lineBlockAt(target.state.doc.line(index + 1).from);
        target.scrollDOM.scrollTop = targetBlock.top + (mapped - index) * targetBlock.height +
            Math.min(source.scrollDOM.scrollTop, target.documentPadding.top);

        // Record the actual position after browser clamping so its scroll event cannot feed back.
        lastTop[to] = target.scrollDOM.scrollTop;
    }

    views.forEach((view, index) => {
        view.scrollDOM.addEventListener("scroll", () => {
            const top = view.scrollDOM.scrollTop;
            if (top === lastTop[index]) return;
            lastTop[index] = top;
            sync(index);
        }, { passive: true });
    });
    return () => sync(0);
}
