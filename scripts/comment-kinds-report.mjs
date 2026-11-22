// Comment-kind report: the transition classes (from -> to) of comment kinds between source, pass 1 and pass 2 over
// the repository inputs (test/*.flix, fixtures), extra paths and, with --sites, comment-site variants (as
// `review:sweep sites`, sampled by --every). Run `npm run review:kinds -- --help`.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";
import plugin from "../dist/index.js";
import { IDEMPOTENCE_WIDTHS, SITE_WIDTHS, loadInputs, repoInputs, requireInputs } from "./review-sweep-lib.mjs";
import { parseKindsArgs, runKindsReport } from "./comment-kinds-report-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HELP = `Usage: npm run review:kinds -- [options] [dir-or-file...]

Formats test/*.flix, the fixture inputs and the extra paths twice per width and counts every change of comment kind
(attached before or after a token; own line, line start, line end, inline) between source, pass 1 and pass 2.
Exit code 0: every run is idempotent; 1: a run is not idempotent; 2: invalid usage.

Options
  --sites         also run comment-site variants (as review:sweep sites), widths ${SITE_WIDTHS.join(",")}
  --every <n>     with --sites: every n-th site (default 6)
  --widths <a,b>  printWidth values (default ${IDEMPOTENCE_WIDTHS.join(",")}); widths below 40 are best effort, not supported
  --no-repo       use only the extra paths
  --json <file>   write the classes as JSON
  --help          this text

Build first with npm run build: the report runs the plugin in dist/.`;

const format = (t, w) => prettierFormat(t, { parser: "flix", plugins: [plugin], printWidth: w });

async function main() {
    const o = parseKindsArgs(process.argv.slice(2));
    if (o.help) {
        console.log(HELP);
        return 0;
    }
    const inputs = requireInputs([...(o.repo ? repoInputs(join(root, "test")) : []), ...loadInputs(o.paths, { base: root })]);
    return runKindsReport(o, { format, inputs });
}

main().then(
    (code) => process.exit(code),
    (e) => {
        console.error(`comment-kinds-report: ${e.message}`);
        process.exit(2);
    },
);
