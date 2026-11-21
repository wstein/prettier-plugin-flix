import assert from "node:assert/strict";
import test from "node:test";
import { releaseNotesProblem } from "../scripts/check-release-changelog.mjs";

test("release notes require Unreleased and a version section with list items", () => {
    const notes = "## [Unreleased]\n\n## [1.2.3] - 2026-01-01\n\n- Ship the fix.\n";
    assert.equal(releaseNotesProblem(notes, "1.2.3"), undefined);
    assert.equal(
        releaseNotesProblem("## [Unreleased]\n\n## [1.2.3] - x\n\nTested with Flix.\n", "1.2.3"),
        "Move reviewed release notes into a [1.2.3] section in CHANGELOG.md.",
    );
    assert.equal(
        releaseNotesProblem("## [Unreleased]\n\n## [1.2.3] - x\n\n<!-- TODO -->\n", "1.2.3"),
        "Move reviewed release notes into a [1.2.3] section in CHANGELOG.md.",
    );
    assert.equal(
        releaseNotesProblem("## [1.2.3] - x\n\n- Ship the fix.\n", "1.2.3"),
        "Keep an [Unreleased] heading in CHANGELOG.md.",
    );
    assert.equal(releaseNotesProblem(notes.replace(/\n/g, "\r\n"), "1.2.3"), undefined);
});
