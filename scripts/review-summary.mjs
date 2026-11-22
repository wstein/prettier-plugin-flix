// Build the formatter review summary from versioned sweep exports and/or an
// official-examples audit directory. Does not change check exit status: callers
// publish the Markdown separately (for example into $GITHUB_STEP_SUMMARY).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
    mergeShardResults,
    parseResultDocument,
    renderReviewSummary,
} from "./sweep-results.mjs";

const HELP = `Usage: npm run review:summary -- [options]

Compare like-for-like sweep result exports and/or read an official-examples audit
report, then write a Markdown summary for GitHub Actions.

Options
  --base <file>         base (before) sweep result JSON
  --candidate <file>    candidate (after) sweep result JSON
  --merge <file>...     merge shard exports into one document (writes --out)
  --audit <dir>         official-examples audit directory (report.json)
  --artifact-url <url>  link shown next to representative cases
  --out <file>          write Markdown (default: stdout); with --merge, write JSON
  --help                this text

Examples
  npm run review:summary -- --base base.json --candidate head.json --audit official-examples-audit --out summary.md
  npm run review:summary -- --merge shard-1.json shard-2.json shard-3.json --out merged.json
`;

function loadDoc(path) {
    return parseResultDocument(readFileSync(path, "utf8"), path);
}

function main(argv) {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            base: { type: "string" },
            candidate: { type: "string" },
            merge: { type: "boolean", default: false },
            audit: { type: "string" },
            "artifact-url": { type: "string" },
            out: { type: "string" },
            help: { type: "boolean", default: false },
        },
    });
    if (values.help) {
        console.log(HELP);
        return 0;
    }
    if (values.merge) {
        const files = positionals.length > 0 ? positionals : [];
        if (files.length === 0) throw new Error("--merge needs one or more shard JSON files");
        if (values.base || values.candidate || values.audit) {
            throw new Error("--merge cannot be combined with --base, --candidate, or --audit");
        }
        const merged = mergeShardResults(files.map((f) => loadDoc(resolve(f))));
        const text = `${JSON.stringify(merged, null, 2)}\n`;
        if (values.out) writeFileSync(resolve(values.out), text);
        else process.stdout.write(text);
        return 0;
    }
    if (positionals.length > 0) {
        throw new Error(`unexpected arguments: ${positionals.join(" ")} (shard files go after --merge)`);
    }
    const sweep = {
        base: values.base ? loadDoc(resolve(values.base)) : null,
        candidate: values.candidate ? loadDoc(resolve(values.candidate)) : null,
    };
    const md = renderReviewSummary({
        sweep,
        audit: values.audit ? resolve(values.audit) : null,
        artifactUrl: values["artifact-url"],
    });
    if (values.out) writeFileSync(resolve(values.out), md);
    else process.stdout.write(md);
    return 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (e) {
        console.error(`review-summary: ${e.message}`);
        process.exitCode = 2;
    }
}

export { main };
