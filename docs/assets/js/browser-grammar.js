// The browser build aliases the eager CLI registry to this registry.
import { grammarIdForVersion, resolveFlixVersion } from "../../../dist/flix-version.js";

const grammars = new Map();
const loading = new Map();
const loaders = {
    "flix-0.79.0": () => import("../../../dist/grammar-079.js").then(({ grammar79 }) => grammar79),
    "flix-0.80.0": () => import("../../../dist/grammar-080.js").then(({ grammar80 }) => grammar80),
};

export async function loadFormatterGrammar(options) {
    const id = grammarIdForVersion(resolveFlixVersion(options?.flixVersion));
    if (!loading.has(id)) {
        loading.set(id, loaders[id]().then((grammar) => grammars.set(id, grammar)));
    }
    await loading.get(id);
}

export function grammarForId(id) {
    const grammar = grammars.get(id);
    if (!grammar) throw new Error("The browser formatter has not loaded " + id);
    return grammar;
}
