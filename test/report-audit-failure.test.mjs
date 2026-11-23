import assert from "node:assert/strict";
import test from "node:test";
import { reportAuditFailure } from "../scripts/report-audit-failure.mjs";

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
