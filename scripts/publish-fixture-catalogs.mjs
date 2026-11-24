import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { filterFixtureCatalog } from "../docs/assets/js/playground-example-versions.js";
import { DEFAULT_FLIX_VERSION, SUPPORTED_FLIX_VERSIONS } from "../dist/flix-version.js";

function runHugo({ destination, baseURL: url, flixDocVersion, docs, dataDir, fragmentPath, fixtures }) {
    writeFileSync(join(dataDir, "fixtures.json"), JSON.stringify(fixtures) + "\n");
    writeFileSync(fragmentPath, [
        `dataDir = ${JSON.stringify(dataDir)}`,
        "[params]",
        `flixDocVersion = "${flixDocVersion}"`,
        "",
    ].join("\n"));

    const result = spawnSync(
        "hugo",
        [
            "--minify",
            "--destination", destination,
            "--baseURL", url,
            "--config", `hugo.toml,${fragmentPath}`,
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
}

export function publishFixtureCatalogs({
    docs,
    baseURL,
    publicDir,
    sourceDataDir = join(docs, "data"),
    tempDirectory = tmpdir(),
}) {
    const allFixtures = JSON.parse(readFileSync(join(sourceDataDir, "fixtures.json"), "utf8"));
    const staging = mkdtempSync(join(tempDirectory, "flix-docs-public-"));
    try {
        const dataDir = join(staging, "data");
        const fragmentPath = join(staging, "catalog.toml");
        cpSync(sourceDataDir, dataDir, { recursive: true });

        const inputs = { docs, dataDir, fragmentPath };
        const rootDest = join(staging, "root");
        runHugo({
            destination: rootDest,
            baseURL,
            flixDocVersion: DEFAULT_FLIX_VERSION,
            ...inputs,
            fixtures: filterFixtureCatalog(allFixtures, DEFAULT_FLIX_VERSION),
        });
        for (const version of SUPPORTED_FLIX_VERSIONS) {
            runHugo({
                destination: join(staging, `flix-${version}`),
                baseURL: `${baseURL}flix/${version}/`,
                flixDocVersion: version,
                ...inputs,
                fixtures: filterFixtureCatalog(allFixtures, version),
            });
        }

        rmSync(publicDir, { recursive: true, force: true });
        cpSync(rootDest, publicDir, { recursive: true });
        for (const version of SUPPORTED_FLIX_VERSIONS) {
            const target = join(publicDir, "flix", version);
            cpSync(join(staging, `flix-${version}`), target, { recursive: true });
        }
    } finally {
        rmSync(staging, { recursive: true, force: true });
    }
}
