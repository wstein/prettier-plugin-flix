// Markdown fixture format for formatter tests.
//
//   ---                         front matter (YAML)
//   title: Short description
//   flix: "0.80"                Flix release the case was written for
//   options: { printWidth: 80 } optional Prettier options for every block
//   status: pass                pass | todo | error
//   ---
//   ## Input
//   ```flix            exactly one block
//   ...
//   ```
//   ## Output
//   ```flix            one or more blocks (none for status: error)
//   ...
//   ```
//   ```flix printWidth=40   further blocks: same input, other options
//
// See README.md ("Fixtures") for the rules.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import YAML from "yaml";

export const STATUSES = ["pass", "todo", "error"];
const META_KEYS = new Set(["title", "description", "flix", "options", "status", "issue", "message", "source", "tags"]);
const OPTION_TYPES = { printWidth: "number", tabWidth: "number", useTabs: "boolean" };

const fail = (file, line, msg) => {
    throw new Error(`${file}${line ? `:${line}` : ""}: ${msg}`);
};

/** Validates the `options` mapping of the front matter with the same rules as inline options. */
function checkOptions(file, line, options) {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
        fail(file, line, 'front matter "options" must be a mapping such as { printWidth: 80 }');
    }
    for (const [k, v] of Object.entries(options)) {
        if (!(k in OPTION_TYPES)) fail(file, line, `unknown option "${k}" (allowed: ${Object.keys(OPTION_TYPES).join(", ")})`);
        if (OPTION_TYPES[k] === "number") {
            if (!Number.isInteger(v) || v < 1) fail(file, line, `option "${k}" must be a positive integer, found ${JSON.stringify(v)}`);
        } else if (typeof v !== "boolean") {
            fail(file, line, `option "${k}" must be true or false, found ${JSON.stringify(v)}`);
        }
    }
}

/** Parses one inline option value; only literal `true`/`false` and positive integers are accepted. */
function parseOptionValue(file, line, key, raw) {
    if (OPTION_TYPES[key] === "number") {
        if (!/^[1-9]\d{0,8}$/.test(raw)) fail(file, line, `option "${key}" must be a positive integer, found "${raw}"`);
        return Number(raw);
    }
    if (raw !== "true" && raw !== "false") fail(file, line, `option "${key}" must be true or false, found "${raw}"`);
    return raw === "true";
}

function parseInfo(file, line, info) {
    const [lang, ...rest] = info.trim().split(/\s+/).filter(Boolean);
    if (lang !== "flix") fail(file, line, `code blocks must be tagged "flix", found "${lang ?? ""}"`);
    const options = {};
    for (const token of rest) {
        const m = /^(\w+)=(.*)$/.exec(token);
        if (!m) fail(file, line, `bad option "${token}" (expected key=value)`);
        const [, key, raw] = m;
        if (!(key in OPTION_TYPES)) fail(file, line, `unknown option "${key}" (allowed: ${Object.keys(OPTION_TYPES).join(", ")})`);
        if (key in options) fail(file, line, `duplicate option "${key}"`);
        options[key] = parseOptionValue(file, line, key, raw);
    }
    return options;
}

/** Parses fixture text. `file` is only used in error messages. */
export function parseFixture(text, file = "<fixture>") {
    // CRLF files (Windows editors, autocrlf checkouts) parse like LF files; the convention is kept
    // when the Output blocks are rewritten.
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    const lines = text.split(/\r?\n/);
    if (lines[0] !== "---") fail(file, 1, "a fixture must start with a --- front matter line");
    const close = lines.indexOf("---", 1);
    if (close < 0) fail(file, 1, "front matter is not closed by ---");
    let meta;
    try {
        meta = YAML.parse(lines.slice(1, close).join("\n"));
    } catch (e) {
        fail(file, 2, `front matter is not valid YAML: ${e.message}`);
    }
    if (meta === null || typeof meta !== "object" || Array.isArray(meta)) fail(file, 2, "front matter must be a mapping");
    for (const k of Object.keys(meta)) if (!META_KEYS.has(k)) fail(file, 2, `unknown front matter key "${k}"`);
    if (typeof meta.title !== "string" || meta.title.trim() === "") fail(file, 2, "front matter needs a non-empty title");
    if (typeof meta.flix !== "string" || !/^\d+\.\d+$/.test(meta.flix)) fail(file, 2, 'front matter "flix" must be a quoted major.minor string such as "0.80"');
    meta.status ??= "pass";
    if (!STATUSES.includes(meta.status)) fail(file, 2, `status must be one of ${STATUSES.join(", ")}`);
    if ("options" in meta) checkOptions(file, 2, meta.options);
    else meta.options = {};

    const blocks = [];
    let section = null;
    for (let i = close + 1; i < lines.length; i++) {
        const heading = /^## (.*)$/.exec(lines[i]);
        if (heading) {
            section = heading[1].trim();
            if (section !== "Input" && section !== "Output") fail(file, i + 1, `unknown section "## ${section}" (allowed: Input, Output)`);
            continue;
        }
        const open = /^```(.*)$/.exec(lines[i]);
        if (!open) continue;
        if (section === null) fail(file, i + 1, "code block before ## Input");
        const options = parseInfo(file, i + 1, open[1]);
        const start = i + 1;
        let end = start;
        while (end < lines.length && lines[end] !== "```") end++;
        if (end >= lines.length) fail(file, i + 1, "code block is not closed");
        blocks.push({ section, options, start, end, line: i + 1, code: lines.slice(start, end).map((l) => l + "\n").join("") });
        i = end;
    }

    const inputs = blocks.filter((b) => b.section === "Input");
    const outputs = blocks.filter((b) => b.section === "Output");
    if (inputs.length !== 1) fail(file, close + 1, `expected exactly one Input block, found ${inputs.length}`);
    if (Object.keys(inputs[0].options).length > 0) fail(file, inputs[0].line, "the Input block takes no options");
    if (meta.status === "error") {
        if (outputs.length > 0) fail(file, outputs[0].line, "status: error fixtures have no Output block");
    } else if (outputs.length === 0) {
        fail(file, close + 1, "expected at least one Output block");
    } else if (Object.keys(outputs[0].options).length > 0) {
        fail(file, outputs[0].line, "the first Output block takes no options (use the front matter for those)");
    }
    return { file, meta, lines, eol, input: inputs[0], outputs };
}

export function loadFixture(path, label = path) {
    return parseFixture(readFileSync(path, "utf8"), label);
}

/** Prettier options for one Output block: front matter first, block options on top. */
export const optionsFor = (fixture, block) => ({ ...fixture.meta.options, ...block.options });

/** Replaces the code of the Output blocks with `actual[i]` and returns the new file text. */
export function withOutputs(fixture, actual) {
    const lines = [...fixture.lines];
    for (let i = fixture.outputs.length - 1; i >= 0; i--) {
        const { start, end } = fixture.outputs[i];
        const body = actual[i] === "" ? [] : actual[i].replace(/\n$/, "").split("\n");
        lines.splice(start, end - start, ...body);
    }
    return lines.join(fixture.eol);
}

export function writeOutputs(path, fixture, actual) {
    writeFileSync(path, withOutputs(fixture, actual));
}

export function findFixtures(dir) {
    const out = [];
    for (const entry of readdirSync(dir).sort()) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...findFixtures(full));
        else if (entry.endsWith(".md") && entry.toLowerCase() !== "readme.md") out.push(full);
    }
    return out;
}

export const relativeTo = (dir, path) => relative(dir, path).split("\\").join("/");
