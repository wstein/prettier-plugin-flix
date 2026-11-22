// Comment-kind detector: for every comment of an input, the "kind" it has in the source, in the output of
// pass 1 and in the output of pass 2, and every transition of that kind. The printer decides layout from
// the kind it reads (`nl`, `nlNext`, trail or lead); when pass 1 changes the kind, pass 2 reads another
// input and may decide differently. Library only: callers pass `format(text, width)`.
import { parseFlix } from "../dist/parse.js";

/** Kind label of one comment: where it attaches and whether line breaks surround it. */
export function kindOf(c, attach) {
    const where = c.nl > 0 ? (c.nlNext > 0 ? "own-line" : "line-start") : c.nlNext > 0 ? "line-end" : "inline";
    return `${attach}:${where}${c.isLine ? ":line" : ""}`;
}

/** Comments of `text` in source order as `{ text, kind }`. */
export function commentKinds(text) {
    const root = parseFlix(text);
    const all = [];
    for (const info of root.info.values()) {
        for (const c of info.trail) all.push({ c, attach: "trail" });
        for (const c of info.lead) all.push({ c, attach: "lead" });
    }
    all.sort((a, b) => a.c.end - b.c.end);
    return all.map(({ c, attach }) => ({ text: c.text, kind: kindOf(c, attach), line: text.slice(0, c.end).split("\n").length }));
}

/** Transitions between two comment lists of equal length and text: `{ index, text, from, to }`. */
export function transitions(a, b) {
    if (a.length !== b.length || a.some((x, i) => x.text !== b[i].text)) return null;
    return a.flatMap((x, i) => (x.kind === b[i].kind ? [] : [{ index: i, text: x.text, from: x.kind, to: b[i].kind, line: b[i].line }]));
}

/** Pass 1 and pass 2 of `source` at `width`: the transitions source->out1 and out1->out2, plus idempotence. */
export async function analyze(format, source, width) {
    const out1 = await format(source, width);
    const out2 = await format(out1, width);
    const k0 = commentKinds(source);
    const k1 = commentKinds(out1);
    const k2 = commentKinds(out2);
    return { out1, out2, idempotent: out1 === out2, first: transitions(k0, k1), second: transitions(k1, k2) };
}
