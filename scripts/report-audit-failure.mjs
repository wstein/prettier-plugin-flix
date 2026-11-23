import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const marker = "<!-- official-flix-examples-scheduled-failure -->";
const title = "Scheduled audit of official Flix examples failed";

export function reportAuditFailure(api, env) {
    const repo = env.GITHUB_REPOSITORY;
    const endpoint = "repos/" + repo + "/issues";
    const run = env.GITHUB_RUN_NUMBER;
    const attempt = env.GITHUB_RUN_ATTEMPT;
    const runUrl = env.GITHUB_SERVER_URL + "/" + repo + "/actions/runs/" + env.GITHUB_RUN_ID;
    const artifact = env.AUDIT_ARTIFACT_URL;
    const body = [
        marker,
        "<!-- audit-run: " + run + "." + attempt + " -->",
        "",
        "The latest reported scheduled audit of the official Flix examples failed.",
        "",
        "- [Workflow run " + run + ", attempt " + attempt + "](" + runUrl + ")",
        artifact
            ? "- [Audit artifact](" + artifact + ") with the reports produced by the run."
            : "- This run did not upload an audit artifact.",
        "",
        "Use the run log or audit reports to distinguish upstream example drift from a formatter or workflow failure.",
    ].join("\n");

    const issues = api(["--paginate", "--slurp",
        endpoint + "?state=all&creator=github-actions%5Bbot%5D&sort=created&direction=asc&per_page=100"]).flat();
    // Prefer the newest matching bot issue when duplicates exist.
    const issue = issues.findLast((item) =>
        !item.pull_request && item.user?.login === "github-actions[bot]" && item.body?.includes(marker));
    if (!issue) return api(["--method", "POST", endpoint, "--input", "-"], { title, body });

    // GitHub concurrency prevents simultaneous writes, but does not order queued jobs.
    const [, previousRun, previousAttempt] = issue.body.match(/<!-- audit-run: (\d+)\.(\d+) -->/) ?? [];
    if (Number(previousRun) > Number(run) ||
        (previousRun === run && Number(previousAttempt) >= Number(attempt))) return issue;
    const update = { body };
    if (issue.state === "closed") Object.assign(update, { state: "open", state_reason: "reopened" });
    return api(["--method", "PATCH", endpoint + "/" + issue.number, "--input", "-"], update);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const api = (args, input) => JSON.parse(execFileSync("gh", ["api", ...args], {
        encoding: "utf8",
        input: input === undefined ? undefined : JSON.stringify(input),
    }));
    console.log(reportAuditFailure(api, process.env).html_url);
}
