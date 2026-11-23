/**
 * Publish the fixture catalog once at the site root (stable URLs) and once under
 * /flix/<version>/ for each supported Flix syntax pin.
 *
 * One Hugo invocation per version keeps RelPermalink, search, and sidebar links
 * inside that catalog. GitHub Pages deploys the merged docs/public tree.
 * Shared Markdown and fixture data feed every build; only baseURL and
 * params.flixDocVersion differ. The toolbar switcher moves between catalogs.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { DEFAULT_FLIX_VERSION, SUPPORTED_FLIX_VERSIONS } from "../dist/flix-version.js";

const docs = fileURLToPath(new URL("../docs/", import.meta.url));
const dist = fileURLToPath(new URL("../dist", import.meta.url));
const formatterDir = join(docs, "assets/js/formatter");
const publicDir = join(docs, "public");
const hugoToml = readFileSync(join(docs, "hugo.toml"), "utf8");
const baseURL = hugoToml.match(/^baseURL\s*=\s*"([^"]+)"/m)?.[1];
if (!baseURL) throw new Error("docs/hugo.toml must set baseURL");
if (!baseURL.endsWith("/")) throw new Error("baseURL must end with /");

/** Exact Flix pins that get a versioned catalog path. Root URLs mirror the latest. */
const versionedCatalogs = [...SUPPORTED_FLIX_VERSIONS];

rmSync(formatterDir, { recursive: true, force: true });
await build({
    entryPoints: [join(docs, "assets/js/format-flix.js")],
    outdir: formatterDir,
    bundle: true,
    splitting: true,
    format: "esm",
    target: "es2022",
    // Parser dispatch depends on generated class names.
    keepNames: true,
    entryNames: "[name]-[hash]",
    chunkNames: "[name]-[hash]",
    plugins: [{
        name: "browser-grammar",
        setup(build) {
            build.onResolve({ filter: /^\.\/grammar\.js$/ }, ({ resolveDir }) =>
                resolveDir === dist ? { path: join(docs, "assets/js/browser-grammar.js") } : undefined);
        },
    }],
});

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
        if (result.error) {
            throw new Error(`Could not start Hugo for ${url}: ${result.error.message}`, { cause: result.error });
        }
        if (result.status !== 0) {
            const reason = result.signal ? `signal ${result.signal}` : `exit ${result.status}`;
            throw new Error(`Hugo failed for ${url} (${reason})`);
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
