// Fails when the Flix release pinned by wstein/flix-spec has a different major.minor than this
// plugin's version, i.e. Flix moved and the plugin has not been re-checked and re-versioned.
// Usage: node scripts/check-flix-version.mjs <path-to-flix-spec/pin.json>
import { readFileSync } from "node:fs";

const pin = JSON.parse(readFileSync(process.argv[2], "utf8"));
const flix = /^v?(\d+)\.(\d+)\./.exec(pin.upstream.tag);
const plugin = /^(\d+)\.(\d+)\./.exec(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
if (!flix || !plugin) throw new Error(`cannot parse versions: flix-spec ${pin.upstream.tag}`);

if (flix[1] !== plugin[1] || flix[2] !== plugin[2]) {
    console.error(`Flix is at ${pin.upstream.tag} (flix-spec pin) but the plugin is ${plugin[0]}x.\n` +
        "Update @wstein/flix-antlr-grammar to the matching grammar, run the corpus gate, and bump the plugin to the same major.minor.");
    process.exit(1);
}
console.log(`plugin ${plugin[1]}.${plugin[2]}.x matches Flix ${pin.upstream.tag}`);
