import { countColumn, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { renderDiff } from "./playground-diff.js";
import { createEditor, createFlixHighlighter } from "./playground-editor.js";
import { readHandoff, writeHandoff } from "./playground-link.js";
import { playgroundDefaultFlixVersion, playgroundIndentation } from "./playground-options.js";
import { requestFormat } from "./playground-requests.js";
import { linkEditorScroll } from "./playground-scroll.js";
import { fetchSource, sourceReference } from "./playground-source.js";

let highlighterPromise;
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
    const flixVersion = playground.querySelector("[data-flix-version]");
    const defaultWidth = Number(printWidth.defaultValue);
    const defaultFlixVersion = flixVersion?.value || playgroundDefaultFlixVersion;
    if (initial) {
        printWidth.value = initial.printWidth ?? defaultWidth;
        if (flixVersion) flixVersion.value = initial.flixVersion ?? defaultFlixVersion;
    }
    const status = playground.querySelector(".playground-status");
    const cursorPosition = playground.querySelector("[data-cursor-position]");
    const copy = playground.querySelector(".playground-copy");
    const useFormatted = playground.querySelector(".playground-use-formatted");
    const diff = playground.querySelector("[data-diff]");
    const formatted = playground.querySelector("[data-output]");
    const previewModes = playground.querySelectorAll("[data-preview-mode]");
    const scrollToggle = playground.querySelector("[data-sync-scroll]");

    let timer;
    let revision = 0;
    let preview = initial?.output === undefined ? undefined : { source: initial.source, output: initial.output };
    let highlighter;
    let fixtures;
    let highlightingFailed = false;
    let announceTakeOver = false;

    const input = createEditor(playground.querySelector("[data-input]"), queuePreview, initial?.source, showCursor, status.id);
    const output = createEditor(formatted, undefined, preview?.output);
    let previewSource = preview ? input.view.state.doc : undefined;
    const syncFromInput = linkEditorScroll(input.view, output.view, () =>
        scrollToggle.checked && !formatted.hidden && preview && previewSource === input.view.state.doc);
    scrollToggle.addEventListener("change", syncFromInput);
    updateColumnGuides();

    function updateColumnGuides() {
        const width = printWidth.validity.valid ? printWidth.valueAsNumber : undefined;
        input.setColumnGuide(width);
        output.setColumnGuide(width);
    }

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

    function syncPreviewActions() {
        if (!preview) {
            useFormatted.disabled = true;
            return;
        }
        copy.disabled = preview.output.length === 0;
        // Enabled when the snapshot differs from input (Formatted or Diff).
        useFormatted.disabled = preview.output === input.view.state.doc.toString();
    }

    function queuePreview() {
        const id = revision = ++nextRequest;
        clearTimeout(timer);
        copy.disabled = true;
        useFormatted.disabled = true;
        showStatus("Formatting…");
        onChange?.(snapshot());
        timer = setTimeout(() => updatePreview(id), 250);
    }

    function updatePreview(id) {
        highlighter?.apply(input.view);
        const invalidWidth = !printWidth.validity.valid;
        if (invalidWidth) {
            printWidth.setAttribute("aria-invalid", "true");
            printWidth.setAttribute("aria-errormessage", status.id);
            input.markError();
            // Drop the previous snapshot so Formatted and Diff are not stale.
            preview = undefined;
            replaceCode(output.view, input.view.state.doc.toString());
            highlighter?.apply(output.view);
            refreshDiff();
            copy.disabled = true;
            useFormatted.disabled = true;
            showStatus("Enter a whole number greater than zero for line width.", true);
            return;
        }
        printWidth.removeAttribute("aria-invalid");
        printWidth.removeAttribute("aria-errormessage");
        requestFormat(playground.dataset.worker, {
            id,
            asset: playground.dataset.formatter,
            source: input.view.state.doc.toString(),
            options: {
                printWidth: printWidth.valueAsNumber,
                flixVersion: flixVersion?.value || playgroundDefaultFlixVersion,
                ...playgroundIndentation,
            },
        }, (data) => {
            if (id !== revision) return;
            if (data.failure) {
                // Drop the previous snapshot so Formatted and Diff are not stale.
                preview = undefined;
                replaceCode(output.view, input.view.state.doc.toString());
                highlighter?.apply(output.view);
                refreshDiff();
                copy.disabled = true;
                useFormatted.disabled = true;
                announceTakeOver = false;
                showStatus(data.failure === "timeout"
                    ? "Formatting timed out. Edit to try again."
                    : "The formatter could not load. Edit to try again.", true);
                return;
            }
            displayPreview(data);
        });
    }

    function displayPreview(data) {
        if (data.error) {
            const { location, message } = data.error;
            const where = location ? `Line ${location.line}, column ${location.column}. ` : "";
            input.markError(location, true);
            if (data.output === undefined) {
                // Recovery could not change the source: show it unchanged and
                // drop any previous formatted snapshot so Diff is not stale.
                const source = input.view.state.doc.toString();
                preview = undefined;
                replaceCode(output.view, source);
                highlighter?.apply(output.view);
                refreshDiff();
                copy.disabled = source.length === 0;
                useFormatted.disabled = true;
                announceTakeOver = false;
                showStatus("Not formatted. " + where + readableDiagnostic(message), true);
                return;
            }
            showStatus("Partially formatted. Error. " + where + readableDiagnostic(message), true);
            announceTakeOver = false;
        } else if (input.view.contentDOM.hasAttribute("aria-invalid")) input.markError();
        previewSource = input.view.state.doc;
        preview = { source: previewSource.toString(), output: data.output };
        replaceCode(output.view, preview.output);
        // Remap after layout so Sync survives wrapping that changes the preview height.
        highlighter?.apply(output.view);
        refreshDiff();
        syncPreviewActions();
        if (!data.error) {
            if (announceTakeOver) {
                announceTakeOver = false;
                showStatus("Input updated from formatted preview.");
            } else {
                showStatus(highlightingFailed ? "Syntax highlighting could not load." : "");
            }
        }
        requestAnimationFrame(() => syncFromInput());
    }

    function refreshDiff() {
        if (diff.hidden) return;
        if (preview) renderDiff(diff, preview, highlighter?.tokenize);
        else diff.textContent = "No formatted preview is available.";
    }

    for (const button of previewModes) {
        button.addEventListener("click", () => {
            const showDiff = button.dataset.previewMode === "diff";
            for (const mode of previewModes) mode.setAttribute("aria-pressed", String(mode === button));
            diff.hidden = !showDiff;
            formatted.hidden = showDiff;
            scrollToggle.disabled = showDiff;
            if (!showDiff) syncFromInput();
            refreshDiff();
        });
    }

    function useExample(key, variant) {
        const fixture = Object.hasOwn(fixtures, key) ? fixtures[key] : undefined;
        const options = variant === undefined ? undefined : fixture?.options[variant];
        loadDraft({ source: fixture?.input ?? "", ...options });
        if (fixture) showStatus("Loading example…");
    }

    function loadDraft({ source, printWidth: width = defaultWidth, flixVersion: version = defaultFlixVersion }) {
        printWidth.value = width;
        if (flixVersion) flixVersion.value = version;
        updateColumnGuides();
        replaceCode(input.view, source);
        queuePreview();
    }

    function snapshot() {
        return {
            source: input.view.state.doc.toString(),
            printWidth: printWidth.validity.valid ? printWidth.valueAsNumber : defaultWidth,
            flixVersion: flixVersion?.value || defaultFlixVersion,
        };
    }

    const sourceDialog = playground.querySelector("[data-source-dialog]");
    if (sourceDialog) {
        const sourceForm = sourceDialog.querySelector("[data-source-reference]");
        const original = playground.querySelector("[data-original-source]");
        const sourceStatus = playground.querySelector("[data-source-status]");
        const dialogStatus = sourceDialog.querySelector("[data-source-dialog-status]");
        const copySource = playground.querySelector("[data-copy-source]");
        const reproLink = playground.querySelector("[data-repro-link]");
        const urlField = sourceForm.elements.namedItem("sourceUrl");
        const removeReference = sourceDialog.querySelector("[data-remove-reference]");
        const submitButtons = sourceForm.querySelectorAll('button[type="submit"]');
        let reference;
        let sourceRequest;

        function setReference(next) {
            reference = next;
            original.hidden = !next;
            removeReference.hidden = !next;
            copySource.hidden = !next?.downloadUrl;
            sourceStatus.textContent = "";
            reproLink.hidden = true;
            if (next) {
                original.href = next.href;
                const suffix = next.sourceLines ? ":" + next.sourceLines.replace("-", "–") : "";
                original.textContent = `Original · ${next.filename}${suffix}`;
            } else original.removeAttribute("href");
        }

        function setLoading(loading) {
            urlField.disabled = loading;
            removeReference.disabled = loading;
            for (const button of submitButtons) button.disabled = loading;
        }

        setReference(sourceReference(initial?.sourceUrl, initial?.sourceLines));
        playground.querySelector("[data-open-source]").addEventListener("click", () => {
            urlField.value = reference?.sourceUrl ?? "";
            dialogStatus.textContent = "";
            sourceDialog.showModal();
        });
        sourceDialog.querySelector("[data-close-source]").addEventListener("click", () => {
            sourceRequest?.abort();
            sourceDialog.close();
        });
        sourceDialog.addEventListener("cancel", () => sourceRequest?.abort());
        removeReference.addEventListener("click", () => {
            setReference(undefined);
            sourceDialog.close();
        });

        async function copyShareLink(draft, confirmation) {
            const link = new URL(location.href);
            link.searchParams.delete("fixture");
            link.searchParams.delete("variant");
            const url = writeHandoff(link, draft);
            reproLink.hidden = true;
            try {
                await navigator.clipboard.writeText(url);
                sourceStatus.textContent = confirmation;
            } catch {
                reproLink.value = url;
                reproLink.hidden = false;
                reproLink.select();
                sourceStatus.textContent = "Copy the selected link.";
            }
        }

        playground.querySelector("[data-copy-playground]").addEventListener("click", () =>
            copyShareLink({ ...snapshot(), ...reference }, "Permalink copied."));
        copySource.addEventListener("click", () => {
            const { printWidth, flixVersion } = snapshot();
            return copyShareLink({ ...reference, printWidth, flixVersion }, "Source link copied.");
        });
        sourceForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const url = urlField.value.trim();
            const requested = sourceReference(url, url === reference?.sourceUrl ? reference.sourceLines : undefined);
            if (!requested) {
                dialogStatus.textContent = "Enter an HTTPS source URL without credentials.";
                return;
            }
            if (event.submitter?.value === "attach") {
                setReference(requested);
                sourceDialog.close();
                sourceStatus.textContent = "Source reference attached.";
                return;
            }
            if (!requested.downloadUrl) {
                dialogStatus.textContent = "Use a GitHub file URL with a full commit SHA.";
                return;
            }

            const currentDoc = input.view.state.doc;
            const request = new AbortController();
            sourceRequest = request;
            setLoading(true);
            dialogStatus.textContent = "Loading source…";
            try {
                const source = await fetchSource(requested.downloadUrl, request.signal);
                if (!sourceDialog.open || request.signal.aborted) return;
                if (input.view.state.doc !== currentDoc) {
                    dialogStatus.textContent = "Input changed while loading. Click Load to try again.";
                    return;
                }
                setReference(requested);
                sourceDialog.close();
                select.value = "";
                replaceCode(input.view, source);
                queuePreview();
                const doc = input.view.state.doc;
                const [first, last = first] = (requested.sourceLines ?? "1").split("-").map(Number);
                if (last > doc.lines) {
                    sourceStatus.textContent = "Source loaded. The requested lines are outside the file.";
                    return;
                }
                const anchor = doc.line(first).from;
                input.view.dispatch({
                    selection: { anchor: requested.sourceLines ? doc.line(last).to : anchor, head: anchor },
                    effects: EditorView.scrollIntoView(anchor, { y: "start" }),
                });
                input.view.focus();
                sourceStatus.textContent = "Source loaded.";
            } catch (error) {
                if (sourceDialog.open && !request.signal.aborted) {
                    dialogStatus.textContent = `Could not load source. ${error.message}`;
                }
            } finally {
                sourceRequest = undefined;
                setLoading(false);
            }
        });
        select.addEventListener("change", () => setReference(undefined));
    }

    select?.addEventListener("change", () => useExample(select.value));
    playground.querySelector(".playground-clear")?.addEventListener("click", () => {
        if (select) select.value = "";
        input.view.dispatch({ changes: { from: 0, to: input.view.state.doc.length, insert: "" } });
        input.view.focus();
    });
    printWidth.addEventListener("input", () => {
        updateColumnGuides();
        queuePreview();
    });
    flixVersion?.addEventListener("change", queuePreview);

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

    useFormatted.addEventListener("click", () => {
        if (!preview || preview.output === input.view.state.doc.toString()) return;
        // Use the preview snapshot so Diff mode works while the Formatted pane is hidden.
        const code = preview.output;
        if (select) select.value = "";
        announceTakeOver = true;
        // Keep history so the previous input is one undo step (unlike load/replace helpers).
        input.view.dispatch({ changes: { from: 0, to: input.view.state.doc.length, insert: code } });
        input.view.focus();
    });

    async function fetchFixtures(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("The fixture data is unavailable.");
        return response.json();
    }

    async function loadExamples() {
        if (revision === 0) showStatus("Loading examples…");
        try {
            const data = await fetchFixtures(playground.dataset.examples);
            fixtures = data.fixtures;
            const params = new URLSearchParams(location.search);
            const requested = params.get("fixture");
            const variant = params.has("variant") ? Number(params.get("variant")) : undefined;
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
                useExample(requested, variant);
                return;
            }
            if (requested) {
                const linked = await fetchFixtures(playground.dataset.linkedFixtures);
                if (revision !== 0) return;
                if (Object.hasOwn(linked, requested)) {
                    fixtures[requested] = linked[requested];
                    useExample(requested, variant);
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
        if (preview) syncPreviewActions();
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
        onChange: ({ source, printWidth, flixVersion: version }) => {
            const widthOverride = printWidth === initial.printWidth ? undefined : printWidth;
            const versionOverride = version === (initial.flixVersion ?? playgroundDefaultFlixVersion)
                ? undefined : version;
            link.href = writeHandoff(originalLink, {
                source,
                printWidth: widthOverride,
                flixVersion: versionOverride,
            });
        },
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
