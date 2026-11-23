// The browser build aliases the eager CLI registry to this registry.
import { grammarIdForVersion, resolveFlixVersion } from "../../../dist/flix-version.js";

/** Load-once grammar cache that forgets a failed import so callers can retry. */
export function createGrammarCache(loaders) {
    const grammars = new Map();
    const loading = new Map();
    return {
        async load(id) {
            if (grammars.has(id)) return;
            let pending = loading.get(id);
            if (!pending) {
                pending = loaders[id]().then(
                    (grammar) => {
                        grammars.set(id, grammar);
                        loading.delete(id);
                        return grammar;
                    },
                    (error) => {
                        loading.delete(id);
                        throw error;
                    },
                );
                loading.set(id, pending);
            }
            await pending;
        },
        get(id) {
            const grammar = grammars.get(id);
            if (!grammar) throw new Error("The browser formatter has not loaded " + id);
            return grammar;
        },
    };
}

const cache = createGrammarCache({
    "flix-0.79.0": () => import("../../../dist/grammar-079.js").then(({ grammar79 }) => grammar79),
    "flix-0.80.0": () => import("../../../dist/grammar-080.js").then(({ grammar80 }) => grammar80),
});

export async function loadFormatterGrammar(options) {
    await cache.load(grammarIdForVersion(resolveFlixVersion(options?.flixVersion)));
}

export function grammarForId(id) {
    return cache.get(id);
}
