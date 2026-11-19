import { Transaction } from "@codemirror/state";
import { renderDiff } from "./playground-diff.js";
import { createEditor, createFlixHighlighter } from "./playground-editor.js";
import { readHandoff } from "./playground-link.js";

let highlighterPromise;

export function mountWorkbench(playground, { initial, onChange } = {}) {
    const select = playground.querySelector("#playground-example");
    const printWidth = playground.querySelector("#print-width");
    const tabWidth = playground.querySelector("#tab-width");
    const status = playground.querySelector(".playground-status");
    const copy = playground.querySelector(".playground-copy");
    const diff = playground.querySelector("#flix-diff");
    const formatted = playground.querySelector("#flix-output");
    const previewModes = playground.querySelectorAll("[data-preview-mode]");

    let timer;
    let revision = 0;
    let useTabs = false;
    let preview;
    let highlighter;
    let fixtures;
    let formatterFailed = false;
    let highlightingFailed = false;
    let destroyed = false;

    const input = createEditor(playground.querySelector("#flix-input"), queuePreview);
    const output = createEditor(formatted);
    const formatter = new Worker(playground.dataset.worker, { type: "module" });

    function replaceCode(view, code) {
        if (view.state.doc.toString() !== code) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: code },
                annotations: Transaction.addToHistory.of(false),
            });
        }
    }

    function showStatus(message, isError = false) {
        status.toggleAttribute("data-error", isError);
        status.textContent = message;
    }

    function queuePreview() {
        const id = ++revision;
        clearTimeout(timer);
        copy.disabled = true;
        onChange?.(snapshot());
        timer = setTimeout(() => updatePreview(id), 250);
    }

    function updatePreview(id) {
        highlighter?.apply(input.view);
        if (formatterFailed) return;
        if (!printWidth.validity.valid || !tabWidth.validity.valid) {
            showStatus("Enter a whole number greater than zero for line width and indent.", true);
            return;
        }
        const width = tabWidth.valueAsNumber;
        input.setTabWidth(width);
        output.setTabWidth(width);
        diff.style.tabSize = width;
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
            const stale = preview ? "Preview is out of date. " : "";
            showStatus(stale + where + message, true);
            return;
        }
        preview = { source: input.view.state.doc.toString(), output: data.output };
        replaceCode(output.view, preview.output);
        highlighter?.apply(output.view);
        refreshDiff();
        copy.disabled = data.output.length === 0;
        showStatus(highlightingFailed ? "Syntax highlighting could not load." : "");
    });

    formatter.addEventListener("error", () => {
        formatterFailed = true;
        showStatus("The formatter could not load. Reload the page to try again.", true);
    });

    function refreshDiff() {
        if (!diff.hidden && preview) renderDiff(diff, preview, highlighter?.tokenize);
    }

    for (const button of previewModes) {
        button.addEventListener("click", () => {
            const showDiff = button.dataset.previewMode === "diff";
            for (const mode of previewModes) mode.setAttribute("aria-pressed", String(mode === button));
            diff.hidden = !showDiff;
            formatted.hidden = showDiff;
            refreshDiff();
        });
    }

    function useExample(key, variant = 0) {
        const fixture = Object.hasOwn(fixtures, key) ? fixtures[key] : undefined;
        const options = fixture?.options[variant] ?? fixture?.options[0] ?? {};
        loadDraft({ source: fixture?.input ?? "", ...options });
    }

    function loadDraft({ source, printWidth: width = 80, tabWidth: indent = 4, useTabs: tabs = false }) {
        printWidth.value = width;
        tabWidth.value = indent;
        useTabs = tabs;
        replaceCode(input.view, source);
        queuePreview();
    }

    function snapshot() {
        return {
            source: input.view.state.doc.toString(),
            printWidth: printWidth.validity.valid ? printWidth.valueAsNumber : 80,
            tabWidth: tabWidth.validity.valid ? tabWidth.valueAsNumber : 4,
            useTabs,
        };
    }

    select?.addEventListener("change", () => useExample(select.value));
    playground.querySelector(".playground-clear")?.addEventListener("click", () => {
        select.value = "";
        input.view.dispatch({ changes: { from: 0, to: input.view.state.doc.length, insert: "" } });
        input.view.focus();
    });
    for (const field of [printWidth, tabWidth]) field.addEventListener("input", queuePreview);

    copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(output.view.state.doc.toString());
            showStatus("Copied to clipboard.");
        } catch {
            const { view } = output;
            view.focus();
            view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
            showStatus("Output selected. Use your copy shortcut.");
        }
    });

    async function fetchFixtures(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("The fixture data is unavailable.");
        return response.json();
    }

    async function loadExamples() {
        try {
            const data = await fetchFixtures(playground.dataset.examples);
            fixtures = data.fixtures;
            const params = new URLSearchParams(location.search);
            const requested = params.get("fixture");
            for (const { title, examples } of data.groups) {
                const group = document.createElement("optgroup");
                group.label = title;
                for (const [label, path] of examples) group.append(new Option(label, path));
                select.append(group);
            }
            select.disabled = false;
            // Keep any edits made while the examples or linked fixture loaded.
            if (revision !== 0) return;
            const curated = Object.hasOwn(fixtures, requested);
            if (requested && !curated) {
                const linked = await fetchFixtures(playground.dataset.linkedFixtures);
                if (revision !== 0) return;
                if (Object.hasOwn(linked, requested)) {
                    fixtures[requested] = linked[requested];
                    useExample(requested, Number(params.get("variant")));
                    return;
                }
            }
            select.value = curated ? requested : data.defaultFixture;
            useExample(select.value, curated ? Number(params.get("variant")) : 0);
        } catch {
            if (revision === 0) showStatus("Examples could not load. Paste Flix code to get started.", true);
        }
    }

    if (initial) loadDraft(initial);
    if (select) void loadExamples();
    highlighterPromise ??= createFlixHighlighter();
    void highlighterPromise.then((flix) => {
        if (destroyed) return;
        highlighter = flix;
        highlighter.apply(input.view);
        highlighter.apply(output.view);
        refreshDiff();
    }).catch(() => {
        if (destroyed) return;
        highlightingFailed = true;
        if (preview && !status.textContent) showStatus("Syntax highlighting could not load.");
    });

    return {
        snapshot,
        focus: () => input.view.focus(),
        destroy() {
            destroyed = true;
            clearTimeout(timer);
            formatter.terminate();
            input.view.destroy();
            output.view.destroy();
        },
    };
}

const page = document.querySelector("[data-full-playground]");
if (page) mountWorkbench(page, { initial: readHandoff(location.hash) });
