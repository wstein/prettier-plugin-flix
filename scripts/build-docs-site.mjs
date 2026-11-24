/**
 * Publish the fixture catalog once at the site root (stable URLs) and once under
 * /flix/<version>/ for each supported Flix syntax pin.
 *
 * One Hugo invocation per version keeps RelPermalink, search, and sidebar links
 * inside that catalog. GitHub Pages deploys the merged docs/public tree.
 * Shared Markdown and version-filtered fixture data feed each build. The
 * toolbar switcher moves between catalogs.
 */
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { publishFixtureCatalogs } from "./publish-fixture-catalogs.mjs";
import { SUPPORTED_FLIX_VERSIONS } from "../dist/flix-version.js";

const docs = fileURLToPath(new URL("../docs/", import.meta.url));
const dist = fileURLToPath(new URL("../dist", import.meta.url));
const formatterDir = join(docs, "assets/js/formatter");
const publicDir = join(docs, "public");
const hugoToml = readFileSync(join(docs, "hugo.toml"), "utf8");
const baseURL = hugoToml.match(/^baseURL\s*=\s*"([^"]+)"/m)?.[1];
if (!baseURL) throw new Error("docs/hugo.toml must set baseURL");
if (!baseURL.endsWith("/")) throw new Error("baseURL must end with /");

rmSync(formatterDir, { recursive: true, force: true });
await build({
    entryPoints: [join(docs, "assets/js/format-flix.js")],
    outdir: formatterDir,
    bundle: true,
    splitting: true,
    format: "esm",
    target: "es2022",
    minify: true,
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

publishFixtureCatalogs({ docs, baseURL, publicDir });
console.log(`Published root catalog and /flix/{${SUPPORTED_FLIX_VERSIONS.join(",")}}/`);
