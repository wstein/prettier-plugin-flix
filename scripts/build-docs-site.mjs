/**
 * Publish the fixture catalog once at the site root (stable URLs) and once under
 * /flix/<version>/ for each syntax pin that has its own docs tree.
 *
 * One Hugo invocation per version keeps RelPermalink, search, and sidebar links
 * inside that catalog. GitHub Pages deploys the merged docs/public tree.
 *
 * Start with the latest pin only; add further versions (and a switcher) when their
 * fixtures and Playground defaults are ready.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { DEFAULT_FLIX_VERSION } from "../dist/flix-version.js";

const docs = fileURLToPath(new URL("../docs/", import.meta.url));
const publicDir = join(docs, "public");
const hugoToml = readFileSync(join(docs, "hugo.toml"), "utf8");
const baseURL = hugoToml.match(/^baseURL\s*=\s*"([^"]+)"/m)?.[1];
if (!baseURL) throw new Error("docs/hugo.toml must set baseURL");
if (!baseURL.endsWith("/")) throw new Error("baseURL must end with /");

/** Exact Flix pins that get a versioned catalog path. Root URLs mirror the latest. */
const versionedCatalogs = [DEFAULT_FLIX_VERSION];

function runHugo({ destination, baseURL: url, flixDocVersion }) {
    const fragmentPath = join(docs, ".hugo-flix-version.toml");
    const fragment = [
        `# Generated for docs build; not committed.`,
        "[params]",
        `flixDocVersion = "${flixDocVersion ?? ""}"`,
        "",
    ].join("\n");
    writeFileSync(fragmentPath, fragment);
    try {
        const result = spawnSync(
            "hugo",
            [
                "--minify",
                "--destination", destination,
                "--baseURL", url,
                "--config", "hugo.toml,.hugo-flix-version.toml",
            ],
            { stdio: "inherit", cwd: docs, env: process.env },
        );
        if (result.status !== 0) {
            throw new Error(`hugo failed for ${url} (exit ${result.status ?? "signal"})`);
        }
    } finally {
        rmSync(fragmentPath, { force: true });
    }
}

const staging = mkdtempSync(join(tmpdir(), "flix-docs-public-"));
try {
    const rootDest = join(staging, "root");
    runHugo({ destination: rootDest, baseURL, flixDocVersion: DEFAULT_FLIX_VERSION });

    for (const version of versionedCatalogs) {
        const versionDest = join(staging, `flix-${version}`);
        runHugo({
            destination: versionDest,
            baseURL: `${baseURL}flix/${version}/`,
            flixDocVersion: version,
        });
    }

    rmSync(publicDir, { recursive: true, force: true });
    cpSync(rootDest, publicDir, { recursive: true });
    for (const version of versionedCatalogs) {
        const target = join(publicDir, "flix", version);
        cpSync(join(staging, `flix-${version}`), target, { recursive: true });
    }
} finally {
    rmSync(staging, { recursive: true, force: true });
}

console.log(`Published root catalog and /flix/{${versionedCatalogs.join(",")}}/`);
