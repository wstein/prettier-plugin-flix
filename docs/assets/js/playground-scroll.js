import { Chunk } from "@codemirror/merge";

function buildDiffChunks(before, after) {
    return Chunk.build(before, after, { scanLimit: 500, timeout: 50 });
}

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

/** Top-level / nested Flix declaration starters used as sync calibration points. */
const DECL_ANCHOR = /^(?:pub\s+)?(def|law|enum|struct|alias|trait|instance|eff|mod|rel|lat|type)\b(?:\s+alias)?\s*(`[^`]+`|[A-Za-z_][\w']*)?/;

/**
 * Collect declaration anchors from a CodeMirror document.
 * Keys are kind + name so matching survives wrapping that rewrites the rest of the line.
 */
export function declarationAnchors(doc) {
    const anchors = [];
    for (let number = 1; number <= doc.lines; number++) {
        const text = doc.line(number).text;
        const match = DECL_ANCHOR.exec(text);
        if (!match) continue;
        const kind = match[1] === "type" && /^\s*(?:pub\s+)?type\s+alias\b/.test(text) ? "alias" : match[1];
        const name = match[2] ?? "";
        anchors.push({ line: number - 1, key: `${kind}\0${name}` });
    }
    return anchors;
}

/** Pair source and target anchors that share the same kind+name, in document order. */
export function matchDeclarationAnchors(before, after) {
    const pending = new Map();
    for (const anchor of after) {
        const queue = pending.get(anchor.key);
        if (queue) queue.push(anchor.line);
        else pending.set(anchor.key, [anchor.line]);
    }
    const pairs = [];
    for (const anchor of before) {
        const queue = pending.get(anchor.key);
        if (!queue?.length) continue;
        pairs.push([anchor.line, queue.shift()]);
    }
    return pairs;
}

/**
 * Map a (possibly fractional) line using matched declaration anchors as fixed points.
 * Returns null when there are no pairs so callers can fall back to diff mapping.
 */
export function mapLineByAnchors(line, pairs, from, to) {
    if (!pairs.length) return null;
    const points = pairs.map((pair) => [pair[from], pair[to]]).sort((a, b) => a[0] - b[0]);
    for (const [source, target] of points) {
        if (line === source) return target;
    }
    if (line < points[0][0]) return points[0][1] + (line - points[0][0]);
    const last = points[points.length - 1];
    if (line > last[0]) return last[1] + (line - last[0]);
    for (let index = 0; index < points.length - 1; index++) {
        const [start, targetStart] = points[index];
        const [end, targetEnd] = points[index + 1];
        if (line > end) continue;
        if (end === start) return targetStart;
        return targetStart + (line - start) * (targetEnd - targetStart) / (end - start);
    }
    return line;
}

function buildLineChanges(before, after) {
    return buildDiffChunks(before, after).map((chunk) => [
        [lineIndex(before, chunk.fromA), lineIndex(before, chunk.toA)],
        [lineIndex(after, chunk.fromB), lineIndex(after, chunk.toB)],
    ]);
}

/** Map a source line onto the target document, preferring declaration anchors. */
export function mapSyncedLine(line, before, after, from = 0, to = 1) {
    const pairs = matchDeclarationAnchors(declarationAnchors(before), declarationAnchors(after));
    const anchored = mapLineByAnchors(line, pairs, from, to);
    if (anchored !== null) return anchored;
    return mapLine(line, buildLineChanges(before, after), from, to);
}

export function linkEditorScroll(input, output, canSync) {
    const views = [input, output];
    const lastTop = views.map((view) => view.scrollDOM.scrollTop);
    let documents;
    let changes;
    let pairs;

    function sync(from) {
        const to = 1 - from;
        const source = views[from];
        const target = views[to];
        if (!canSync() || !target.scrollDOM.clientHeight) return;

        // replaceCode swaps document identity, so the map rebuilds on the next sync.
        const current = views.map((view) => view.state.doc);
        if (!documents || current.some((doc, index) => doc !== documents[index])) {
            documents = current;
            const [before, after] = documents;
            changes = buildLineChanges(before, after);
            pairs = matchDeclarationAnchors(declarationAnchors(before), declarationAnchors(after));
        }

        const height = Math.max(0, source.scrollDOM.scrollTop - source.documentPadding.top);
        const block = source.lineBlockAtHeight(height);
        const line = lineIndex(source.state.doc, block.from) + (height - block.top) / block.height;
        const anchored = mapLineByAnchors(line, pairs, from, to);
        const mapped = Math.max(0, Math.min(
            target.state.doc.lines - 1,
            anchored !== null ? anchored : mapLine(line, changes, from, to),
        ));
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
