#!/usr/bin/env node
// Opt-in CLI for the Flix Datalog review-rules prototype (#209).
// Default: Node mirror of ReviewRules.flix (no Flix jar required).
// With FLIX_JAR: also run the Flix program and require matching findings.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
    loadAndEvaluate,
    findingsFromExistingTooling,
    runFlixPrototype,
    writeJson,
} from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function usage() {
    console.log(`Usage: npm run review:rules -- --sweep <export.json> [options]

Options:
  --sweep <file>       Sweep result export (schemaVersion 1) [required]
  --known <file>       Known-failure list (idempotence or sites shape)
  --audit <dir>        Official-examples audit directory (report.json)
  --reviews <file>     Approval map (docs/official-example-reviews.json)
  --out <file>         Write findings JSON (default: stdout)
  --flix-out <dir>     Directory for generated Main.flix when FLIX_JAR is set
  --compare-tooling    Also print whether findings match the #206 Node helpers
  --help               Show this help

Environment:
  FLIX_JAR             Optional path to a pinned flix.jar (e.g. v0.80.0). When set,
                       the Flix prototype must emit the same findings as the Node mirror.
`);
}

function parseArgs(argv) {
    const o = {
        sweep: null,
        known: null,
        audit: null,
        reviews: null,
        out: null,
        flixOut: join(here, "out"),
        compareTooling: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h") return { help: true };
        if (a === "--compare-tooling") { o.compareTooling = true; continue; }
        const next = argv[++i];
        if (!next) throw new Error(`${a} needs a value`);
        if (a === "--sweep") o.sweep = next;
        else if (a === "--known") o.known = next;
        else if (a === "--audit") o.audit = next;
        else if (a === "--reviews") o.reviews = next;
        else if (a === "--out") o.out = next;
        else if (a === "--flix-out") o.flixOut = next;
        else throw new Error(`unknown option: ${a}`);
    }
    return o;
}

function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    if (args.help) { usage(); return 0; }
    if (!args.sweep) { usage(); return 2; }

    const loaded = loadAndEvaluate({
        sweepPath: resolve(args.sweep),
        knownPath: args.known ? resolve(args.known) : null,
        auditDir: args.audit ? resolve(args.audit) : null,
        reviewsPath: args.reviews ? resolve(args.reviews) : null,
    });

    const payload = {
        schemaVersion: 1,
        prototype: "analysis/review-rules",
        rules: ["R1-fail-without-exception", "R2-layout-unapproved"],
        findings: loaded.findings,
    };

    if (args.compareTooling) {
        const tooling = findingsFromExistingTooling({
            sweep: loaded.sweep,
            knownIds: loaded.facts.known,
            layoutChanges: loaded.layoutChanges,
            reviews: loaded.reviews,
        });
        payload.matchesExistingTooling = JSON.stringify(tooling) === JSON.stringify(loaded.findings);
    }

    const jar = process.env.FLIX_JAR;
    if (jar) {
        const flix = runFlixPrototype(loaded.facts, {
            jarPath: jar,
            outDir: resolve(args.flixOut),
            rulesFile: join(here, "ReviewRules.flix"),
        });
        payload.flix = flix.skipped
            ? { skipped: true, reason: flix.reason }
            : { ok: flix.ok, findings: flix.findings, status: flix.status, stderr: flix.stderr };
        if (!flix.skipped && flix.ok) {
            payload.matchesFlix = JSON.stringify(flix.findings) === JSON.stringify(loaded.findings);
            if (!payload.matchesFlix) {
                console.error("Flix findings differ from the Node mirror");
                console.error("node:", JSON.stringify(loaded.findings, null, 2));
                console.error("flix:", JSON.stringify(flix.findings, null, 2));
                return 1;
            }
        } else if (!flix.skipped && !flix.ok) {
            console.error(flix.stderr || flix.stdout || "flix run failed");
            return 1;
        }
    }

    const text = `${JSON.stringify(payload, null, 2)}\n`;
    if (args.out) writeJson(resolve(args.out), payload);
    else process.stdout.write(text);
    return 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (e) {
        console.error(`review-rules: ${e.message}`);
        process.exitCode = 2;
    }
}

export { main };
