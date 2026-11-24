import { Chunk } from "@codemirror/merge";

export function buildDiffChunks(before, after) {
    return Chunk.build(before, after, { scanLimit: 500, timeout: 50 });
}
