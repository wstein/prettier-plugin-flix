// Collect a schema-v1 idempotence export for the two #201 repros at widths 20..160.
// Uses the built plugin in dist/. Optional — not part of npm test.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { format as prettierFormat } from "prettier";
import { checkFormat } from "../../scripts/review-sweep-lib.mjs";
import { buildResultDocument, makeCase } from "../../scripts/sweep-results.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The two #201 repros (own-line comment before `=` / hugged match body). */
export const REPROS_201 = [
    {
        file: "equals-own-line",
        source: `def wait(c: Chan, d: Deadline): Unit \\ { Chan, NonDet }
    // own
    = 1
`,
    },
    {
        file: "hug-match-own-line",
        source: `def wait(c: Chan, d: Deadline): Unit \\ { Chan, NonDet } = match
// own
c {
    case _ => ()
}
`,
    },
];

function parseWidthList(text, fallback) {
    if (!text) return fallback;
    return text.split(",").map((w) => Number(w.trim())).filter((w) => Number.isInteger(w) && w > 0);
}

async function main(argv) {
    const { values } = parseArgs({
        args: argv,
        options: {
            widths: { type: "string" },
            "out-dir": { type: "string", default: join(root, "analysis/width-heatmap/out") },
            revision: { type: "string", default: "local" },
            help: { type: "boolean", default: false },
        },
    });
    if (values.help) {
        console.log(`Usage: node analysis/width-heatmap/export-repro-grid.mjs [--widths 20,21,...] [--out-dir dir] [--revision sha]
Formats the #201 repros with dist/ and writes candidate.json (schema v1).`);
        return 0;
    }
    const widths = parseWidthList(values.widths, Array.from({ length: 141 }, (_, i) => i + 20));
    const plugin = (await import(pathToFileURL(join(root, "dist/index.js")).href)).default;
    const format = (text, width) => prettierFormat(text, { parser: "flix", plugins: [plugin], printWidth: width });
    const cases = [];
    for (const repro of REPROS_201) {
        for (const width of widths) {
            const r = await checkFormat(format, repro.source, width);
            if (r) cases.push(makeCase({ file: repro.file, width, status: "fail", kind: r.kind, reason: r.detail }));
            else cases.push(makeCase({ file: repro.file, width, status: "pass" }));
        }
    }
    const doc = buildResultDocument({
        command: "idempotence",
        formatter: { revision: values.revision, dirty: false },
        corpus: { revision: values.revision, inputCount: REPROS_201.length, paths: REPROS_201.map((r) => r.file) },
        config: { widths, every: null, shard: null, base: null, only: null, repo: false, seed: null },
        cases,
    });
    const outDir = resolve(values["out-dir"]);
    mkdirSync(outDir, { recursive: true });
    const out = join(outDir, "candidate.json");
    writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
    const fails = cases.filter((c) => c.status === "fail");
    console.log(`wrote ${out} (${cases.length} cases, ${fails.length} failures)`);
    if (fails.length) {
        const byFile = {};
        for (const f of fails) (byFile[f.file] ??= []).push(f.width);
        for (const [file, ws] of Object.entries(byFile)) console.log(`  ${file}: ${ws.join(",")}`);
    }
    return 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    main(process.argv.slice(2)).then(
        (code) => process.exit(code),
        (e) => {
            console.error(e.message);
            process.exit(2);
        },
    );
}
