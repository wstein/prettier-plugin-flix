import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function releaseNotesProblem(changelog, version) {
    const sections = changelog.replace(/\r\n?/g, "\n").split(/^## /m).slice(1);
    const title = (entry) => entry.split("\n", 1)[0].trim();
    if (!sections.some((entry) => title(entry) === "[Unreleased]")) return "Keep an [Unreleased] heading in CHANGELOG.md.";
    const section = sections.find((entry) => title(entry).startsWith(`[${version}] - `));
    if (!section?.split("\n").slice(1).some((line) => /^[-*] \S/.test(line))) {
        return `Move reviewed release notes into a [${version}] section in CHANGELOG.md.`;
    }
    return undefined;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const { version } = JSON.parse(readFileSync("package.json", "utf8"));
    const problem = releaseNotesProblem(readFileSync("CHANGELOG.md", "utf8"), version);
    if (problem) {
        console.error(problem);
        process.exitCode = 1;
    }
}
