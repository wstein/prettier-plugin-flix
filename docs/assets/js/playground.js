import { countColumn, Transaction } from "@codemirror/state";
import { renderDiff } from "./playground-diff.js";
import { createEditor, createFlixHighlighter } from "./playground-editor.js";
import { readHandoff, writeHandoff } from "./playground-link.js";
import { playgroundIndentation } from "./playground-options.js";

let highlighterPromise;
let formatter;
let nextRequest = 0;

function readableDiagnostic(message) {
    if (message.startsWith("no viable alternative at input ")) {
        return message.replace(/^[^\r\n]+/, "Invalid syntax.");
    }

    return message.replace(
        /^(?:mismatched|extraneous) input ([^\r\n]+) expecting \{[^\r\n]*\}(?=\r?\n|$)/,
        (_, token) => token === "'<EOF>'" ? "Unexpected end of input." : `Unexpected input ${token}.`,
    );
}

function mountWorkbench(playground, { initial, onChange } = {}) {
    const select = playground.querySelector("#playground-example");
    const printWidth = playground.querySelector("[data-print-width]");
    const defaultWidth = Number(printWidth.defaultValue);
    const status = playground.querySelector(".playground-status");
    const cursorPosition = playground.querySelector("[data-cursor-position]");
    const copy = playground.querySelector(".playground-copy");
    const diff = playground.querySelector("[data-diff]");
    const formatted = playground.querySelector("[data-output]");
    const previewModes = playground.querySelectorAll("[data-preview-mode]");

    let timer;
    let revision = 0;
    let preview = initial?.output === undefined ? undefined : { source: initial.source, output: initial.output };
    let highlighter;
    let fixtures;
    let formatterFailed = false;
    let highlightingFailed = false;

    const input = createEditor(playground.querySelector("[data-input]"), queuePreview, initial?.source, showCursor);
    const output = createEditor(formatted, undefined, preview?.output);
    formatter ??= new Worker(playground.dataset.worker, { type: "module" });

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
        if (status.textContent !== message) status.textContent = message;
    }

    function showCursor(state) {
        const { from, to, head, empty } = state.selection.main;
        const line = state.doc.lineAt(head);
        const column = countColumn(line.text, state.tabSize, head - line.from) + 1;
        const count = empty ? "" : ` · ${Array.from(state.sliceDoc(from, to)).length} selected`;
        cursorPosition.textContent = `Ln ${line.number}, Col ${column}${count}`;
    }

    function queuePreview() {
        const id = revision = ++nextRequest;
        clearTimeout(timer);
        copy.disabled = true;
        if (!formatterFailed) showStatus("Formatting…");
        onChange?.(snapshot());
        timer = setTimeout(() => updatePreview(id), 250);
    }

    function updatePreview(id) {
        highlighter?.apply(input.view);
        if (formatterFailed) return;
        if (!printWidth.validity.valid) {
            showStatus("Enter a whole number greater than zero for line width.", true);
            return;
        }
        formatter.postMessage({
            id,
            asset: playground.dataset.formatter,
            source: input.view.state.doc.toString(),
            options: { printWidth: printWidth.valueAsNumber, ...playgroundIndentation },
        });
    }

    formatter.addEventListener("message", ({ data }) => {
        if (data.id !== revision) return;
        if (data.error) {
            const { location, message } = data.error;
            const where = location ? `Line ${location.line}, column ${location.column}. ` : "";
            input.markError(location);
            const label = data.output === undefined ? "Error. " : "Partially formatted. Error. ";
            showStatus(label + where + readableDiagnostic(message), true);
            if (data.output === undefined) return;
        } else if (input.view.contentDOM.hasAttribute("aria-invalid")) input.markError();
        preview = { source: input.view.state.doc.toString(), output: data.output };
        replaceCode(output.view, preview.output);
        highlighter?.apply(output.view);
        refreshDiff();
        copy.disabled = data.output.length === 0;
        if (!data.error) showStatus(highlightingFailed ? "Syntax highlighting could not load." : "");
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
        if (fixture && !formatterFailed) showStatus("Loading example…");
    }

    function loadDraft({ source, printWidth: width = defaultWidth }) {
        printWidth.value = width;
        replaceCode(input.view, source);
        queuePreview();
    }

    function snapshot() {
        return {
            source: input.view.state.doc.toString(),
            printWidth: printWidth.validity.valid ? printWidth.valueAsNumber : defaultWidth,
        };
    }

    select?.addEventListener("change", () => useExample(select.value));
    playground.querySelector(".playground-clear")?.addEventListener("click", () => {
        if (select) select.value = "";
        input.view.dispatch({ changes: { from: 0, to: input.view.state.doc.length, insert: "" } });
        input.view.focus();
    });
    printWidth.addEventListener("input", queuePreview);

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
        if (revision === 0 && !formatterFailed) showStatus("Loading examples…");
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
            if (Object.hasOwn(fixtures, requested)) {
                useExample(requested, Number(params.get("variant")));
                return;
            }
            if (requested) {
                const linked = await fetchFixtures(playground.dataset.linkedFixtures);
                if (revision !== 0) return;
                if (Object.hasOwn(linked, requested)) {
                    fixtures[requested] = linked[requested];
                    useExample(requested, Number(params.get("variant")));
                    return;
                }
            }
            select.value = data.defaultFixture;
            useExample(data.defaultFixture);
        } catch {
            if (revision === 0) showStatus("Examples could not load. Paste Flix code to get started.", true);
        }
    }

    if (initial) {
        printWidth.value = initial.printWidth ?? defaultWidth;
        if (preview) copy.disabled = preview.output.length === 0;
        else queuePreview();
    }
    if (select) void loadExamples();
    highlighterPromise ??= createFlixHighlighter();
    void highlighterPromise.then((flix) => {
        highlighter = flix;
        highlighter.apply(input.view);
        highlighter.apply(output.view);
        refreshDiff();
    }).catch(() => {
        highlightingFailed = true;
        if (preview && !status.textContent) showStatus("Syntax highlighting could not load.");
    });
}

const page = document.querySelector("[data-full-playground]");
if (page) mountWorkbench(page, { initial: readHandoff(location.hash) });

function startEmbedded(embedded) {
    const link = embedded.querySelector(".playground-handoff");
    const originalLink = link.href;
    const initial = JSON.parse(embedded.dataset.initial);
    const lines = Math.max(initial.source.split("\n").length, (initial.output ?? "").split("\n").length);
    embedded.style.setProperty("--source-lines", lines);
    mountWorkbench(embedded, {
        initial,
        onChange: (draft) => { link.href = writeHandoff(originalLink, draft); },
    });
    embedded.hidden = false;
    embedded.previousElementSibling.hidden = true;
    embedded.closest(".fixture").querySelector("[data-static-links]").hidden = true;
}

// Keep long chapters light by starting an editor when its fixture approaches the viewport.
const embeddedEditors = document.querySelectorAll("[data-embedded-playground]");
if (embeddedEditors.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) {
            if (!isIntersecting) continue;
            observer.unobserve(target);
            startEmbedded(target.querySelector("[data-embedded-playground]"));
        }
    }, { rootMargin: "600px 0px" });

    for (const embedded of embeddedEditors) observer.observe(embedded.closest(".fixture"));
}
