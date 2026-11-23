import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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
    const commit = (subject, ...body) => {
        git("commit", "--quiet", "--allow-empty", "-m", subject, ...body.flatMap((part) => ["-m", part]));
        return git("rev-parse", "HEAD").trim().slice(0, 7);
    };
    const draft = (...refs) => {
        const result = spawnSync(process.execPath, [script, ...refs], { cwd, encoding: "utf8" });
        assert.ifError(result.error);
        assert.equal(result.status, 0, result.stderr);
        return result;
    };

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
    const wrapped = commit(
        "fix(formatter): wrapped misplaced trailer",
        "Changelog: Keep a wrapped Changelog line\nwhole in the draft.\nCloses #1",
        "Co-authored-by: A <a@example.test>",
    );
    const empty = commit("fix(formatter): empty misplaced trailer", "Body.\nChangelog:", "Co-authored-by: A <a@example.test>");
    const misplaced = commit(
        "fix(formatter): misplaced trailer still drafts",
        "Body paragraph that keeps Changelog out of the trailer block.\nChangelog: Keep a misplaced Changelog line in the draft.",
    );
    const mixed = commit(
        "test(formatter): mixed trailers",
        "Changelog: Misplaced note.",
        "Changelog: Prefer the final trailer.\nCo-authored-by: A <a@example.test>",
    );
    commit("test(formatter): empty final trailer", "Changelog:\nCo-authored-by: A <a@example.test>");
    commit("test(formatter): add fixtures");
    commit("Legacy change");

    const { stdout: output, stderr } = draft();
    assert.deepEqual(stderr.trim().split("\n"), [mixed, misplaced, empty, wrapped].map((sha) =>
        "Warning: commit " + sha + " has Changelog: outside the final trailer block.",
    ));
    assert.match(output, /Draft from v0\.1\.0/);
    assert.match(output, /## Breaking changes\n\n- Update the plugin import\. — Use the default export\./);
    assert.match(output, /## Features\n\n- add second feature/);
    assert.match(output, /## Fixes\n\n- Keep a misplaced Changelog line in the draft\./);
    assert.match(output, /## Fixes\n\n[\s\S]*- Keep comments on the preceding argument\./);
    assert.match(output, /- Keep a wrapped Changelog line whole in the draft\. \(/);
    assert.match(output, /- empty misplaced trailer \(/);
    assert.match(output, /- Prefer the final trailer\. \(/);
    assert.equal(output.match(/Keep comments on the preceding argument\./g)?.length, 1);
    assert.match(output, /## Other changes to review\n\n- Legacy change/);
    assert.doesNotMatch(output, /first feature|internal subject|add fixtures|another branch|misplaced trailer still drafts|Co-authored-by|Closes #1/);

    git("tag", "v0.1.1");
    assert.match(draft().stdout, /No changelog entries found/);
    assert.equal(draft("v0.1.1", "v0.1.0").stdout, output);
});
