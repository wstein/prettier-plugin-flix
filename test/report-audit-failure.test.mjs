import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { reportAuditFailure } from "../scripts/report-audit-failure.mjs";

const marker = "<!-- official-flix-examples-scheduled-failure -->";
const script = fileURLToPath(new URL("../scripts/report-audit-failure.mjs", import.meta.url));

const baseEnv = {
    GITHUB_REPOSITORY: "wstein/prettier-plugin-flix",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_RUN_ID: "300",
    GITHUB_RUN_NUMBER: "30",
    GITHUB_RUN_ATTEMPT: "1",
};

test("scheduled audit failures reuse the same issue even after it was closed", () => {
    const env = {
        GITHUB_REPOSITORY: "wstein/prettier-plugin-flix",
        GITHUB_SERVER_URL: "https://github.com",
        GITHUB_RUN_ID: "123",
        GITHUB_RUN_NUMBER: "7",
        GITHUB_RUN_ATTEMPT: "1",
        AUDIT_ARTIFACT_URL: "https://github.com/wstein/prettier-plugin-flix/actions/runs/123/artifacts/456",
    };
    const calls = [];
    let issue;
    const api = (args, payload) => {
        calls.push([args, payload]);
        if (args.includes("--paginate")) {
            const unrelated = { body: issue?.body, user: { login: "another-user" }, number: 99 };
            return [[unrelated], issue ? [issue] : []];
        }
        issue = { number: 12, state: "open", user: { login: "github-actions[bot]" }, ...issue, ...payload };
        return issue;
    };

    assert.equal(reportAuditFailure(api, env).number, 12);
    assert.equal(calls[1][0][1], "POST");
    assert.match(issue.body, /actions\/runs\/123\)/);
    assert.ok(issue.body.includes(env.AUDIT_ARTIFACT_URL));

    issue.state = "closed";
    const retry = { ...env, GITHUB_RUN_ID: "124", GITHUB_RUN_NUMBER: "8", AUDIT_ARTIFACT_URL: "" };
    assert.equal(reportAuditFailure(api, retry).number, 12);
    assert.equal(calls[3][0][1], "PATCH");
    assert.match(calls[3][0][2], /\/issues\/12$/);
    assert.equal(issue.state, "open");
    assert.equal(issue.state_reason, "reopened");
    assert.match(issue.body, /no.+upload an audit artifact/);
    assert.match(issue.body, /actions\/runs\/124\)/);

    assert.equal(reportAuditFailure(api, env).number, 12);
    assert.equal(reportAuditFailure(api, retry).number, 12);
    assert.equal(calls.filter(([, payload]) => payload).length, 2);

    const rerun = { ...retry, GITHUB_RUN_ATTEMPT: "2", AUDIT_ARTIFACT_URL: env.AUDIT_ARTIFACT_URL };
    assert.equal(reportAuditFailure(api, rerun).number, 12);
    assert.match(issue.body, /attempt 2/);
    assert.ok(issue.body.includes(rerun.AUDIT_ARTIFACT_URL));
});

test("scheduled audit failures update the newest matching bot issue", () => {
    const env = {
        GITHUB_REPOSITORY: "wstein/prettier-plugin-flix",
        GITHUB_SERVER_URL: "https://github.com",
        GITHUB_RUN_ID: "200",
        GITHUB_RUN_NUMBER: "20",
        GITHUB_RUN_ATTEMPT: "1",
    };
    const older = {
        number: 10,
        state: "closed",
        user: { login: "github-actions[bot]" },
        body: "<!-- official-flix-examples-scheduled-failure -->\n<!-- audit-run: 1.1 -->\n",
    };
    const newer = {
        number: 11,
        state: "open",
        user: { login: "github-actions[bot]" },
        body: "<!-- official-flix-examples-scheduled-failure -->\n<!-- audit-run: 2.1 -->\n",
    };
    const calls = [];
    const api = (args, payload) => {
        calls.push([args, payload]);
        if (args.includes("--paginate")) return [[older, newer]];
        Object.assign(newer, payload);
        return newer;
    };

    assert.equal(reportAuditFailure(api, env).number, 11);
    assert.equal(calls[1][0][1], "PATCH");
    assert.match(calls[1][0][2], /\/issues\/11$/);
    assert.match(newer.body, /actions\/runs\/200\)/);
});

test("scheduled audit failures ignore pull requests, other authors and unmarked bodies", () => {
    const env = { ...baseEnv };
    const calls = [];
    const api = (args, payload) => {
        calls.push([args, payload]);
        if (args.includes("--paginate")) {
            return [[
                {
                    number: 1,
                    pull_request: {},
                    user: { login: "github-actions[bot]" },
                    body: marker + "\n<!-- audit-run: 1.1 -->\n",
                },
                {
                    number: 2,
                    user: { login: "dependabot[bot]" },
                    body: marker + "\n<!-- audit-run: 2.1 -->\n",
                },
                {
                    number: 3,
                    user: { login: "github-actions[bot]" },
                    body: "unrelated scheduled failure without the marker\n",
                },
            ]];
        }
        return { number: 40, state: "open", ...payload };
    };

    const created = reportAuditFailure(api, env);
    assert.equal(created.number, 40);
    assert.equal(calls[1][0][1], "POST");
    assert.match(created.body, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("the report-audit-failure CLI exits when gh api fails", () => {
    const bin = mkdtempSync(join(tmpdir(), "report-audit-gh-"));
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, "gh"), "#!/bin/sh\necho 'gh api failed' >&2\nexit 1\n", { mode: 0o755 });
    const result = spawnSync(process.execPath, [script], {
        encoding: "utf8",
        env: {
            ...process.env,
            PATH: bin,
            GITHUB_REPOSITORY: baseEnv.GITHUB_REPOSITORY,
            GITHUB_SERVER_URL: baseEnv.GITHUB_SERVER_URL,
            GITHUB_RUN_ID: "9",
            GITHUB_RUN_NUMBER: "9",
            GITHUB_RUN_ATTEMPT: "1",
        },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /gh api failed|Command failed|exit/i);
});
