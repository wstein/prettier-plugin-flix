import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const changelog = readFileSync("CHANGELOG.md", "utf8");
const sections = changelog.split(/^## /m).slice(1);
const section = sections.find((entry) => entry.split("\n", 1)[0].startsWith(`[${version}] - `));
if (!sections.some((entry) => entry.split("\n", 1)[0] === "[Unreleased]") ||
    !section?.split("\n").slice(1).some((line) => line.trim() && !/^(?:#|\[.*\]:)/.test(line))) {
    console.error(`Keep an Unreleased heading and move reviewed release notes into a [${version}] section in CHANGELOG.md.`);
    process.exitCode = 1;
}
