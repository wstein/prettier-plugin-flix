import { readFileSync } from "node:fs";

const groups = {
    unsafe: ["Formatter invariant failures", "Reduce to a regression fixture and fix the formatter before approval."],
    wrapping: ["Line wrapping and layout", "Review syntax units together. Keep generator, handler or rule boundaries visible."],
    spacing: ["Spacing and alignment", "Prefer consistent spacing and preserve alignment when it makes code easier to scan."],
    "blank-lines": ["Blank lines", "Keep paragraph boundaries that clarify the explanation."],
    indentation: ["Indentation", "Check that nesting reads clearly at the configured indent width."],
    "line-endings": ["Line endings and final newline", "Treat as a mechanical change when the destination convention requires it."],
    other: ["Other source edits", "Inspect the exact diff and verify the syntax change with the Flix compiler."],
};
const assessments = JSON.parse(readFileSync(new URL("../docs/official-example-assessments.json", import.meta.url), "utf8"));
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function splitDiff(diff) {
    const files = new Map();
    for (const section of diff.split(/^diff --git /m).slice(1)) {
        const name = /^a\/before\/([a-z0-9.-]+)\.flix b\/after\/\1\.flix\n/.exec(section)?.[1];
        const start = section.indexOf("\n@@ ");
        if (!name || start === -1) throw new Error("Could not associate a diff with its example");
        files.set(name, section.slice(start + 1).replace(/\n$/, ""));
    }
    return files;
}

const sectionNames = {
    formatter: "Formatter recommendations",
    documentation: "Documentation improvements",
};
const assessmentMatches = (item, note) =>
    item.case_name === note.case && (item.digest === note.digest || item.signature === note.digest);

function markdownCode(text, language) {
    const width = (text.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length + 1), 3);
    const fence = "`".repeat(width);
    return `${fence}${language}\n${text}\n${fence}`;
}

function colorDiff(diff) {
    return diff.split("\n").map((line) => {
        const type = line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : line.startsWith("@@") ? "hunk" : "";
        return `<span class="${type}">${escape(line)}</span>`;
    }).join("\n");
}

export function renderFindings(cases, diff) {
    const diffs = splitDiff(diff);
    const noted = assessments.flatMap((note) => {
        const item = cases.find((entry) => assessmentMatches(entry, note));
        return item ? [{ ...note, item }] : [];
    });
    const markdown = [
        "# Flix documentation formatter findings", "",
        `${cases.filter((item) => item.hasDiff).length} byte differences. Open a case to review its inline diff.`, "",
        "The comparison uses the extracted code, including a book fence's final newline and the cooked JavaScript website string.",
        "[Open the searchable HTML overview](findings.html)", "",
    ];
    const html = [];
    const navigation = [];
    for (const [area, heading] of Object.entries(sectionNames)) {
        const notes = noted.filter((note) => note.area === area);
        if (!notes.length) continue;
        navigation.push([area, heading]);
        markdown.push(`## ${heading}`, "");
        html.push(`<section id="${area}"><h2>${heading}</h2>`);
        for (const [index, { title, recommendation, snippet, item }] of notes.entries()) {
            const code = snippet ?? diffs.get(item.case_name);
            markdown.push(`### ${title}`, "", recommendation, "", `[Source](${item.url})`, "");
            if (code) markdown.push(markdownCode(code, snippet ? "flix" : "diff"), "");
            html.push(`<details${index === 0 ? " open" : ""}><summary>${escape(title)}</summary>
<p>${escape(recommendation)}</p>
${code ? `<pre><code>${snippet ? escape(code) : colorDiff(code)}</code></pre>` : ""}
<p><a href="${escape(item.url)}">Source</a></p></details>`);
        }
        html.push("</section>");
    }

    markdown.push("## All byte differences", "");
    for (const [group, [title, recommendation]] of Object.entries(groups)) {
        const entries = cases.filter((item) => item.changeKind === group);
        if (!entries.length) continue;
        const heading = `${title} (${entries.length})`;
        navigation.push([group, heading]);
        markdown.push(`### ${heading}`, "", recommendation, "");
        html.push(`<section id="${group}"><h2>${heading}</h2><p>${recommendation}</p>`);
        for (const item of entries) {
            const name = item.case_name;
            const code = diffs.get(name);
            if (item.hasDiff && !code) throw new Error(`Missing diff for ${name}`);
            const caption = item.context === "expression-or-statements" ? " · fragment" : "";
            markdown.push("<details>", `<summary>${name}${caption}</summary>`, "");
            if (code) markdown.push(markdownCode(code, "diff"), "");
            markdown.push(`[Source](${item.url})`, "", "</details>", "");
            html.push(`<details><summary>${name}${caption}</summary>${code ? `<pre><code>${colorDiff(code)}</code></pre>` :
                `<p>${escape(item.reason)}</p>`}<p><a href="${escape(item.url)}">Source</a></p></details>`);
        }
        html.push("</section>");
    }

    return { markdown: markdown.join("\n"), html: page(html.join("\n"), navigation, cases) };
}

function page(content, navigation, cases) {
    const changes = cases.filter((item) => item.hasDiff).length;
    const identical = cases.filter((item) => item.status === "unchanged").length;
    const context = cases.filter((item) => item.status === "needs-context").length;
    return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Official Flix examples · Formatter audit</title>
<style>
:root { color-scheme: light dark; font: 100% system-ui; --edge: #687280; --add: #d4f4dd; --del: #ffe0e0; --add-ink: #164525; --del-ink: #6b1621; }
@media (prefers-color-scheme: dark) { :root { --add: #163c2a; --del: #562931; --add-ink: #daffe5; --del-ink: #ffe5e5; } }
body { margin: auto; max-width: 75rem; padding: 2rem 1.25rem; }
nav { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin: 1rem 0; }
label { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
input { font: inherit; padding: .45rem .65rem; min-width: min(24rem, 100%); box-sizing: border-box; }
section { margin-top: 2rem; }
details { border-bottom: 1px solid var(--edge); padding: .65rem 0; }
summary { cursor: pointer; overflow-wrap: anywhere; }
pre { border: 1px solid var(--edge); overflow-x: auto; padding: .7rem; border-radius: .35rem; }
pre span { display: inline-block; min-width: 100%; }
.added { background: var(--add); color: var(--add-ink); }
.removed { background: var(--del); color: var(--del-ink); }
.hunk { font-weight: 700; }
</style>
<main>
<h1>Official Flix examples</h1>
<p>${changes} byte differences · ${identical} identical · ${context} need context</p>
<label>Find a case <input type="search" placeholder="Search case names or code"></label>
<nav aria-label="Report sections">${navigation.map(([id, name]) => `<a href="#${id}">${name}</a>`).join("\n")}</nav>
${content}
</main>
<script>
const search = document.querySelector("input");
search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    for (const section of document.querySelectorAll("section")) {
        let visible = false;
        for (const item of section.querySelectorAll("details")) {
            item.hidden = !item.textContent.toLowerCase().includes(query);
            visible ||= !item.hidden;
        }
        section.hidden = !visible;
    }
});
</script>
</html>
`;
}
