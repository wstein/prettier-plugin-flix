// Logic shared by `scripts/review-sweep.mjs` and the comment-site test: collecting inputs, checking one
// comment site or one width, reconciling failures with a list of known failures, minimizing an input,
// and diffing outputs. Nothing here formats on its own: callers pass `format(text, width)`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { findFixtures, loadFixture } from "../test/fixture.mjs";
import { COMMENT_MARKERS, commentSites, fingerprint, programProblems, withCommentAt } from "../test/lib.mjs";

/** Failure kinds a known-failure entry can name. Anything else (tokens differ, throws, ...) is never excused. */
export const KNOWN_KINDS = ["unparsable", "not-idempotent"];

/** Widths of the idempotence sweep and of the comment-site sweep. */
export const IDEMPOTENCE_WIDTHS = [40, 50, 60, 70, 80, 100, 120, 160];
export const SITE_WIDTHS = [40, 60, 100];
export const REGRESSION_WIDTHS = [40, 60, 80, 100, 120];

/** Lists `.flix` files below `dir` (or `dir` itself when it is a file), sorted, and fixtures when `fixtures` is set. */
export function collectFiles(path, { fixtures = false } = {}) {
    const found = [];
    const visit = (p) => {
        const st = statSync(p);
        if (st.isDirectory()) {
            for (const entry of readdirSync(p).sort()) visit(join(p, entry));
        } else if (p.endsWith(".flix") || (fixtures && p.endsWith(".md"))) {
            found.push(p);
        }
    };
    visit(path);
    return found;
}

/**
 * Inputs `{ name, source }` below `paths`. `.flix` files are read as they are; `.md` files are
 * fixtures (their Input block, skipped when the fixture has status `error`). `name` is relative to
 * `base` when the file is below it, else the path as given.
 */
export function loadInputs(paths, { base = process.cwd(), fixtures = true } = {}) {
    const inputs = [];
    for (const path of paths) {
        for (const file of collectFiles(path, { fixtures })) {
            const rel = relative(resolve(base), resolve(file)).split("\\").join("/");
            const name = rel.startsWith("..") ? relative(dirname(resolve(path)), resolve(file)).split("\\").join("/") : rel;
            if (file.endsWith(".md")) {
                const fx = loadFixture(file);
                if (fx.meta.status !== "error") inputs.push({ name, source: fx.input.code });
            } else {
                inputs.push({ name, source: readFileSync(file, "utf8") });
            }
        }
    }
    return inputs;
}

/** The repository's own inputs: `test/*.flix` and every fixture below `test/fixtures`, named relative to `test/`. */
export function repoInputs(testDir) {
    const inputs = [];
    for (const f of readdirSync(testDir).filter((f) => f.endsWith(".flix")).sort()) inputs.push({ name: f, source: readFileSync(join(testDir, f), "utf8") });
    for (const path of findFixtures(join(testDir, "fixtures"))) {
        const fx = loadFixture(path);
        if (fx.meta.status !== "error") inputs.push({ name: relative(testDir, path).split("\\").join("/"), source: fx.input.code });
    }
    return inputs;
}

/** Context of a failure for messages: the source around the inserted comment. */
export function contextAround(variant, form) {
    const at = variant.indexOf(COMMENT_MARKERS[form]);
    return variant.slice(Math.max(0, at - 30), at + 30);
}

/**
 * Formats `before` text at `width` twice and returns the first problem found, or null.
 * `kind` is `throw`, `unparsable` (the output does not parse), `program` (tokens, comments, shape
 * or token classes changed) or `not-idempotent`. `output` and `second` carry the texts.
 */
export async function checkFormat(format, text, width, before = fingerprint(text)) {
    let output;
    try {
        output = await format(text, width);
    } catch (e) {
        return { kind: "throw", detail: `threw ${String(e.message).split("\n")[0]}` };
    }
    const after = fingerprint(output);
    const problems = programProblems(before, after);
    if (problems.length > 0) {
        return { kind: after.errors.length > 0 ? "unparsable" : "program", detail: problems.join("; "), output };
    }
    let second;
    try {
        second = await format(output, width);
    } catch (e) {
        return { kind: "unparsable", detail: `second format threw ${String(e.message).split("\n")[0]}`, output };
    }
    if (second !== output) return { kind: "not-idempotent", detail: "not idempotent", output, second };
    return null;
}

/** One comment-site check: insert a comment of `form` at `token`, format at `width`. Null when it passes or the input does not parse. */
export async function checkSite(format, source, token, form, width) {
    const variant = withCommentAt(source, token, form);
    const before = fingerprint(variant);
    if (before.errors.length > 0) return { skipped: true }; // a comment where the grammar does not allow one
    const failure = await checkFormat(format, variant, width, before);
    return failure ? { ...failure, variant, context: contextAround(variant, form) } : { skipped: false, variant };
}

/**
 * The sites of `source` as `{ token, form, width }`, in source order. With `every` above 1, every
 * `every`-th site and every glued site (a tight `.` or `::`) is planned, with the forms and widths
 * rotating from site to site.
 */
export function planSites(source, { every = 1, forms, widths }) {
    const sites = commentSites(source);
    const combos = widths.flatMap((width) => forms.map((form) => ({ form, width })));
    const plan = [];
    if (every === 1) {
        for (const { tokenIndex } of sites) for (const c of combos) plan.push({ token: tokenIndex, ...c });
        return plan;
    }
    // Sampled: every `every`-th site gets one combination; the combination advances from site to site,
    // so a whole run covers every form and width.
    let n = 0;
    sites.forEach((site, i) => {
        const { tokenIndex } = site;
        if (site.glued || i % every === 0) plan.push({ token: tokenIndex, ...combos[n++ % combos.length] });
    });
    return plan;
}

/** Identity of a failure or a known entry. */
export const failureKey = (e) => [e.file, e.width, e.form ?? "plain", e.token ?? "-", e.kind].join("|");
const entryKey = (e) => [e.file, e.width, e.form ?? "plain", e.token ?? "-"].join("|");

/** Reads a known-failures file: `{ "failures": [ { file, width, form, token, kind, issue, context } ] }`. */
export function parseKnown(text, where = "known failures") {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.failures)) throw new Error(`${where}: expected an object with a "failures" array`);
    const keys = new Set();
    for (const e of data.failures) {
        for (const k of ["file", "width", "kind", "issue"]) if (e[k] === undefined) throw new Error(`${where}: entry without "${k}": ${JSON.stringify(e)}`);
        if (!KNOWN_KINDS.includes(e.kind)) throw new Error(`${where}: kind must be one of ${KNOWN_KINDS.join(", ")}: ${JSON.stringify(e)}`);
        if (!/^#\d+$/.test(String(e.issue))) throw new Error(`${where}: issue must look like #123: ${JSON.stringify(e)}`);
        if (keys.has(entryKey(e))) throw new Error(`${where}: duplicate entry: ${JSON.stringify(e)}`);
        keys.add(entryKey(e));
    }
    return data.failures;
}

/**
 * Compares the failures found with the known entries. `checked` holds the entry keys (without the
 * kind) of every combination that was actually run, so an entry whose combination was not run is not
 * judged. Returns `unknown` (failures without an entry, or with another kind than the entry),
 * `fixed` (entries whose combination passed) and `messages` for both.
 */
export function reconcile(known, failures, checked) {
    const byKey = new Map(known.map((e) => [entryKey(e), e]));
    const unknown = [];
    const seen = new Set();
    for (const f of failures) {
        const entry = byKey.get(entryKey(f));
        if (entry && entry.kind === f.kind) seen.add(entryKey(f));
        else unknown.push(f);
    }
    const fixed = known.filter((e) => checked.has(entryKey(e)) && !seen.has(entryKey(e)) && !unknown.some((f) => entryKey(f) === entryKey(e)));
    const messages = [
        ...unknown.map((f) => `unknown failure: ${describe(f)}`),
        ...fixed.map((e) => `known failure now passes: remove it from the list (issue ${e.issue}): ${describe(e)}`),
    ];
    return { unknown, fixed, messages };
}

export const describe = (f) => `${f.file} width=${f.width}${f.form ? ` form=${f.form}` : ""}${f.token !== undefined ? ` token=${f.token}` : ""} ${f.kind}${f.detail ? ` (${f.detail})` : ""}${f.context ? ` ${JSON.stringify(f.context)}` : ""}`;

/** Entries of `known` for `file`, as extra plan items so they are re-checked on every run. */
export function knownPlan(known, file) {
    return known.filter((e) => e.file === file && e.form !== undefined && e.token !== undefined).map((e) => ({ token: e.token, form: e.form, width: e.width }));
}

/** Merges plan items, dropping repeats. */
export function mergePlans(...plans) {
    const seen = new Set();
    return plans.flat().filter((p) => {
        const key = `${p.token}|${p.form}|${p.width}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Runs a comment-site plan on one input; returns `{ failures, checked, skipped }` with `checked` as a Set of entry keys. */
export async function runSitePlan(format, { name, source }, plan) {
    const failures = [];
    const checked = new Set();
    let skipped = 0;
    for (const { token, form, width } of plan) {
        const r = await checkSite(format, source, token, form, width);
        if (r.skipped) {
            skipped++;
            continue;
        }
        checked.add(entryKey({ file: name, width, form, token }));
        if (r.kind) failures.push({ file: name, width, form, token, kind: r.kind, detail: r.detail, context: r.context, input: r.variant, output: r.output, second: r.second });
    }
    return { failures, checked, skipped };
}

/**
 * Shrinks `source` line by line (delta debugging) while `stillFails(text)` stays true. Returns the
 * smallest text found; a text that is not a failure is never returned.
 */
export async function minimize(source, stillFails, { maxChecks = 400 } = {}) {
    let lines = source.split("\n");
    let chunk = Math.max(1, Math.floor(lines.length / 2));
    let checks = 0;
    while (chunk >= 1 && checks < maxChecks) {
        let reduced = false;
        for (let i = 0; i < lines.length && checks < maxChecks; ) {
            const candidate = [...lines.slice(0, i), ...lines.slice(i + chunk)];
            checks++;
            if (candidate.length > 0 && (await stillFails(candidate.join("\n")))) {
                lines = candidate;
                reduced = true;
            } else {
                i += chunk;
            }
        }
        if (!reduced) chunk = Math.floor(chunk / 2);
    }
    return lines.join("\n");
}

/** Line diff as hunks `{ aStart, bStart, removed, added }` (1-based starts); equal texts give []. */
export function lineDiff(a, b) {
    const x = a.split("\n");
    const y = b.split("\n");
    let head = 0;
    while (head < x.length && head < y.length && x[head] === y[head]) head++;
    let tail = 0;
    while (tail < x.length - head && tail < y.length - head && x[x.length - 1 - tail] === y[y.length - 1 - tail]) tail++;
    const xs = x.slice(head, x.length - tail);
    const ys = y.slice(head, y.length - tail);
    if (xs.length === 0 && ys.length === 0) return [];
    const hunks = [];
    const push = (ai, bi, removed, added) => hunks.push({ aStart: head + ai + 1, bStart: head + bi + 1, removed, added });
    if (xs.length * ys.length > 25_000_000) {
        push(0, 0, xs, ys); // too large for an exact diff: one coarse hunk
        return hunks;
    }
    // Longest common subsequence over the differing middle.
    const n = xs.length;
    const m = ys.length;
    const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = xs[i] === ys[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    let i = 0;
    let j = 0;
    let cur = null;
    const flush = () => {
        if (cur) push(cur.i, cur.j, cur.removed, cur.added);
        cur = null;
    };
    while (i < n || j < m) {
        if (i < n && j < m && xs[i] === ys[j]) {
            flush();
            i++;
            j++;
        } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
            cur ??= { i, j, removed: [], added: [] };
            cur.added.push(ys[j++]);
        } else {
            cur ??= { i, j, removed: [], added: [] };
            cur.removed.push(xs[i++]);
        }
    }
    flush();
    return hunks;
}

/** Renders hunks as `@@ -a +b @@` blocks with `-` and `+` lines. */
export function renderHunks(hunks, { limit = Infinity } = {}) {
    return hunks
        .slice(0, limit)
        .map((h) => [`@@ -${h.aStart},${h.removed.length} +${h.bStart},${h.added.length} @@`, ...h.removed.map((l) => `-${l}`), ...h.added.map((l) => `+${l}`)].join("\n"))
        .join("\n");
}

/** Seconds with one decimal, for the run time lines. */
export const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
