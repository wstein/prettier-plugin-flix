import { Transaction } from "@codemirror/state";
import { createEditor, createFlixHighlighter } from "./playground-editor.js";

const playground = document.querySelector(".playground");
const select = playground.querySelector("#playground-example");
const printWidth = playground.querySelector("#print-width");
const tabWidth = playground.querySelector("#tab-width");
const status = playground.querySelector(".playground-status");
const copy = playground.querySelector(".playground-copy");

let timer;
let revision = 0;
let useTabs = false;
let hasPreview = false;
let highlight;
let fixtures;
let formatterFailed = false;
let highlightingFailed = false;

const input = createEditor(playground.querySelector("#flix-input"), queuePreview);
const output = createEditor(playground.querySelector("#flix-output"));
const formatter = new Worker(playground.dataset.worker, { type: "module" });

function replaceCode(view, code) {
    if (view.state.doc.toString() !== code) {
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: code },
            annotations: Transaction.addToHistory.of(false),
        });
    }
}

function queuePreview() {
    const id = ++revision;
    clearTimeout(timer);
    copy.disabled = true;
    timer = setTimeout(() => updatePreview(id), 250);
}

function updatePreview(id) {
    highlight?.(input.view);
    if (formatterFailed) return;
    if (!printWidth.validity.valid || !tabWidth.validity.valid) {
        status.textContent = "Enter a whole number greater than zero for line width and indent.";
        return;
    }
    const width = tabWidth.valueAsNumber;
    input.setTabWidth(width);
    output.setTabWidth(width);
    formatter.postMessage({
        id,
        asset: playground.dataset.formatter,
        source: input.view.state.doc.toString(),
        options: { printWidth: printWidth.valueAsNumber, tabWidth: width, useTabs },
    });
}

formatter.addEventListener("message", ({ data }) => {
    if (data.id !== revision) return;
    if (data.error) {
        const { location, message } = data.error;
        const where = location ? `Line ${location.line}, column ${location.column}. ` : "";
        const stale = hasPreview ? "Preview is out of date. " : "";
        status.textContent = stale + where + message;
        return;
    }
    replaceCode(output.view, data.output);
    highlight?.(output.view);
    hasPreview = true;
    copy.disabled = data.output.length === 0;
    status.textContent = highlightingFailed ? "Syntax highlighting could not load." : "";
});

formatter.addEventListener("error", () => {
    formatterFailed = true;
    status.textContent = "The formatter could not load. Reload the page to try again.";
});

function useExample(key, variant = 0) {
    const fixture = Object.hasOwn(fixtures, key) ? fixtures[key] : undefined;
    const options = fixture?.options[variant] ?? fixture?.options[0] ?? {};
    printWidth.value = options.printWidth ?? 80;
    tabWidth.value = options.tabWidth ?? 4;
    useTabs = options.useTabs ?? false;
    replaceCode(input.view, fixture?.input ?? "");
    queuePreview();
}

select.addEventListener("change", () => useExample(select.value));
for (const field of [printWidth, tabWidth]) field.addEventListener("input", queuePreview);

copy.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(output.view.state.doc.toString());
        status.textContent = "Copied to clipboard.";
    } catch {
        const { view } = output;
        view.focus();
        view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
        status.textContent = "Output selected. Use your copy shortcut.";
    }
});

async function loadExamples() {
    try {
        const response = await fetch(playground.dataset.examples);
        if (!response.ok) throw new Error("The fixture data is unavailable.");
        const data = await response.json();
        fixtures = data.fixtures;
        const examples = Object.entries(fixtures).sort(([, a], [, b]) => a.title.localeCompare(b.title));
        for (const [key, fixture] of examples) select.add(new Option(fixture.title, key));

        const params = new URLSearchParams(location.search);
        const requested = params.get("fixture");
        const linked = Object.hasOwn(fixtures, requested);
        select.value = linked ? requested : data.defaultFixture;
        select.disabled = false;
        // If someone started typing while the examples loaded, keep their input.
        if (revision === 0) useExample(select.value, linked ? Number(params.get("variant")) : 0);
        else select.value = "";
    } catch {
        if (revision === 0) status.textContent = "Examples could not load. Paste Flix code to get started.";
    }
}

void loadExamples();
void createFlixHighlighter().then((apply) => {
    highlight = apply;
    highlight(input.view);
    highlight(output.view);
}).catch(() => {
    highlightingFailed = true;
    if (hasPreview && !status.textContent) status.textContent = "Syntax highlighting could not load.";
});
