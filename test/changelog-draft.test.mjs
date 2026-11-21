import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/changelog-draft.mjs", import.meta.url));

test("release drafts use the stable tag on the first-parent history and read changelog trailers", (t) => {
    const cwd = mkdtempSync(join(tmpdir(), "flix-changelog-"));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
    const commit = (subject, ...body) =>
        git("commit", "--quiet", "--allow-empty", "-m", subject, ...body.flatMap((part) => ["-m", part]));
    const draft = (...refs) => execFileSync(process.execPath, [script, ...refs], { cwd, encoding: "utf8" });

    git("init", "--quiet", "--initial-branch=main");
    git("config", "user.name", "Test");
    git("config", "user.email", "test@example.test");
    git("config", "commit.gpgsign", "false");
    git("config", "tag.gpgsign", "false");
    commit("feat(formatter): add first feature");
    git("tag", "--annotate", "v0.1.0", "--message", "First stable release");
    git("switch", "--quiet", "--create", "other");
    commit("feat(formatter): add feature on another branch");
    git("tag", "v0.2.0");
    git("switch", "--quiet", "main");
    commit("feat(formatter): add second feature");
    git("tag", "v0.1.1-rc.1");
    commit("fix(formatter): internal subject", "Changelog: Keep comments on the preceding argument.");
    commit("fix(api): update import", "BREAKING CHANGE: Use the default export.\nChangelog: Update the plugin import.");
    commit(
        "fix(formatter): misplaced trailer still drafts",
        "Body paragraph that keeps Changelog out of the trailer block.\nChangelog: Keep a misplaced Changelog line in the draft.",
    );
    commit("test(formatter): add fixtures");
    commit("Legacy change");

    const output = draft();
    assert.match(output, /Draft from v0\.1\.0/);
    assert.match(output, /## Breaking changes\n\n- Update the plugin import\. — Use the default export\./);
    assert.match(output, /## Features\n\n- add second feature/);
    assert.match(output, /## Fixes\n\n- Keep a misplaced Changelog line in the draft\./);
    assert.match(output, /## Fixes\n\n[\s\S]*- Keep comments on the preceding argument\./);
    assert.match(output, /## Other changes to review\n\n- Legacy change/);
    assert.doesNotMatch(output, /first feature|internal subject|add fixtures|another branch|misplaced trailer still drafts/);

    git("tag", "v0.1.1");
    assert.match(draft(), /No changelog entries found/);
    assert.equal(draft("v0.1.1", "v0.1.0"), output);
});
