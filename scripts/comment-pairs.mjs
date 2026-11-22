// Pair and triple test: several comments at once, at random sites (`review:sweep sites` inserts only one). A seeded
// sample of two and of three distinct comment sites per input, each with a random form, is formatted twice at every
// width; the checks are those of `review:sweep` (output parses, tokens, comments and shape kept, idempotent). Failures
// carry the comment-kind transitions of scripts/comment-kinds.mjs. Run `npm run review:pairs -- --help`.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";
import plugin from "../dist/index.js";
import { loadInputs, repoInputs, requireInputs } from "./review-sweep-lib.mjs";
import { PAIR_WIDTHS, DEFAULT_PAIRS, DEFAULT_TRIPLES, DEFAULT_SEED, parsePairArgs, runPairTest } from "./comment-pairs-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HELP = `Usage: npm run review:pairs -- [options] [dir-or-file...]

Formats test/*.flix and the fixture inputs with two (pairs) and three (triples) comments inserted at distinct
random sites, at every width, twice. A run passes when the output parses, keeps tokens, comments and shape, and
a second pass changes nothing. Exit code 0: no run failed; 1: at least one failed; 2: invalid usage.

Options
  --pairs <n>     combinations of two comments (default ${DEFAULT_PAIRS})
  --triples <n>   combinations of three comments (default ${DEFAULT_TRIPLES}); 0 skips them
  --seed <n>      seed of the sample, 0 to 4294967295 (default ${DEFAULT_SEED}); the same seed gives the same sample
  --widths <a,b>  printWidth values (default ${PAIR_WIDTHS.join(",")}); widths below 40 are best effort, not supported
  --forms <list>  comment forms to draw from: line, block, own (default all)
  --only <text>   only inputs whose name contains <text>
  --no-repo       use only the extra paths
  --max <n>       print at most n failures (default 15)
  --json <file>   write the failures as JSON
  --help          this text

Build first with npm run build: the test runs the plugin in dist/. The defaults take about 2 minutes (23000 runs).`;

const format = (text, width) => prettierFormat(text, { parser: "flix", plugins: [plugin], printWidth: width });

async function main() {
    const o = parsePairArgs(process.argv.slice(2));
    if (o.help) {
        console.log(HELP);
        return 0;
    }
    const all = [...(o.repo ? repoInputs(join(root, "test")) : []), ...loadInputs(o.paths, { base: root })];
    const inputs = requireInputs(o.only ? all.filter((i) => i.name.includes(o.only)) : all);
    return runPairTest(o, { format, inputs });
}

main().then(
    (code) => process.exit(code),
    (e) => {
        console.error(`comment-pairs: ${e.message}`);
        process.exit(2);
    },
);
