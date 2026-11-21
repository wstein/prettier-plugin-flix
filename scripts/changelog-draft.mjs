import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const repository = "https://github.com/wstein/prettier-plugin-flix";
const stableTag = /^v\d+\.\d+\.\d+$/;
const conventionalSubject = /^([a-z]+)(?:\([^)]+\))?(!)?: (.+)$/;
const publicSections = new Map([
    ["feat", "Features"],
    ["fix", "Fixes"],
    ["perf", "Performance"],
    ["docs", "Documentation"],
]);
const sections = new Map(
    ["Breaking changes", ...publicSections.values(), "Other changes to review"].map(
        (heading) => [heading, []],
    ),
);

function previousRelease(target) {
    const tags = git(
        "for-each-ref",
        "--sort=-version:refname",
        "--format=%(refname:short)%09%(objectname)%09%(*objectname)",
        "refs/tags",
    ).trimEnd().split("\n");
    const tagAtCommit = new Map();
    for (const entry of tags) {
        const [name, object, peeled] = entry.split("\t");
        const commit = peeled || object;
        if (stableTag.test(name) && !tagAtCommit.has(commit)) {
            tagAtCommit.set(commit, name);
        }
    }
    return git("rev-list", "--first-parent", target).trimEnd().split("\n")
        .map((commit) => tagAtCommit.get(commit))
        .find(Boolean);
}

function renderDraft(targetRef, baseRef) {
    const target = git("rev-parse", "--verify", "--end-of-options", `${targetRef}^{commit}`).trim();
    const baseTag = baseRef || previousRelease(target);
    let range = target;
    if (baseTag) {
        const base = git("rev-parse", "--verify", "--end-of-options", `${baseTag}^{commit}`).trim();
        execFileSync("git", ["merge-base", "--is-ancestor", base, target]);
        range = `${base}..${target}`;
    }

    const format = [
        "%H", "%s",
        "%(trailers:key=Changelog,valueonly,unfold,separator=%x1f)",
        "%(trailers:key=BREAKING-CHANGE,valueonly,unfold,separator=%x1f)",
        "%B",
    ].join("%x00");
    const history = git("log", "--no-merges", "-z", `--format=${format}`, range, "--");
    const fields = history.split("\0");
    for (let i = 0; i + 4 < fields.length; i += 5) {
        const [sha, subject, note, breakingNote, message] = fields.slice(i, i + 5);
        // Conventional Commits allows a space in BREAKING CHANGE. Git's
        // trailer parser only accepts the hyphenated spelling.
        const trailers = /^BREAKING CHANGE:/m.test(message)
            ? execFileSync("git", ["interpret-trailers", "--parse"], {
                input: message.replace(/^BREAKING CHANGE:/gm, "BREAKING-CHANGE:"),
                encoding: "utf8",
            })
            : "";
        // Prefer git trailers; also accept a Changelog line anywhere in the body so a
        // misplaced trailer still reaches the draft instead of vanishing silently.
        const changelogFromBody = [...message.matchAll(/(?:^|\n)Changelog:\s*(.+)\s*$/gim)]
            .map((match) => match[1].trim())
            .filter(Boolean)
            .join(" / ");
        const changelogNote = trailers.match(/^Changelog: (.+)$/im)?.[1] || note || changelogFromBody;
        const migrationNote = trailers.match(/^BREAKING-CHANGE: (.+)$/im)?.[1] || breakingNote;
        const [, type, breaking, summary] = conventionalSubject.exec(subject) ?? [];
        const heading = breaking || migrationNote
            ? "Breaking changes"
            : publicSections.get(type) ?? ((!type || changelogNote) ? "Other changes to review" : undefined);
        if (!heading) continue;

        const description = (changelogNote || summary || subject).replaceAll("\x1f", " / ");
        const migration = migrationNote ? ` — ${migrationNote.replaceAll("\x1f", " / ")}` : "";
        sections.get(heading).push(
            `- ${description}${migration} ([${sha.slice(0, 7)}](${repository}/commit/${sha}))`,
        );
    }

    const output = [
        `<!-- Draft from ${baseTag || "initial commit"} through ${target}. Review before publishing. -->`,
    ];
    for (const [heading, entries] of sections) {
        if (entries.length) output.push(`## ${heading}`, entries.join("\n"));
    }
    if (output.length === 1) output.push("No changelog entries found in this range.");
    if (baseTag) output.push(`[Full changes](${repository}/compare/${encodeURIComponent(baseTag)}...${target})`);
    return output.join("\n\n");
}

const args = process.argv.slice(2);
if (args.length > 2) {
    console.error("Usage: npm run --silent changelog:draft -- [target [base]]");
    process.exitCode = 1;
} else {
    try {
        console.log(renderDraft(args[0] || "HEAD", args[1]));
    } catch (error) {
        console.error(`Could not generate changelog draft. ${error.message}`);
        process.exitCode = 1;
    }
}
