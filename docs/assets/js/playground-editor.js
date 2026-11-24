import { defaultKeymap, history, historyField, historyKeymap } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, keymap, lineNumbers } from "@codemirror/view";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { flixThemes } from "./flix-themes.js";
import { playgroundIndentation } from "./playground-options.js";
import grammar from "../syntax/flix.tmLanguage.json";

const setHighlighting = StateEffect.define();
const highlighting = StateField.define({
    create: () => Decoration.none,
    update(decorations, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(setHighlighting)) return effect.value;
        }
        return decorations.map(transaction.changes);
    },
    provide: (field) => EditorView.decorations.from(field),
});

const setErrorMarks = StateEffect.define();
const noError = { marks: Decoration.none, invalid: false };
const errorMarks = StateField.define({
    create: () => noError,
    update(marks, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(setErrorMarks)) return effect.value;
        }
        return transaction.docChanged ? noError : marks;
    },
    provide: (field) => EditorView.decorations.from(field, ({ marks }) => marks),
});
const errorLine = Decoration.line({ class: "flix-error-line" });
const errorCharacter = Decoration.mark({ class: "flix-error-character" });

export function createEditor(parent, onEdit, doc = "", onCursor, diagnosticId, savedState) {
    const { tabWidth } = playgroundIndentation;
    const extensions = [
        lineNumbers(),
        drawSelection(),
        highlighting,
        EditorState.tabSize.of(tabWidth),
        indentUnit.of(" ".repeat(tabWidth)),
        EditorView.contentAttributes.of({
            "aria-labelledby": `${parent.id}-label`,
            spellcheck: "false",
            autocapitalize: "off",
            ...(onEdit ? {} : { tabindex: "0", "aria-readonly": "true" }),
        }),
        ...(onEdit ? [
            errorMarks,
            EditorView.contentAttributes.compute([errorMarks], (state) =>
                state.field(errorMarks).invalid ? { "aria-invalid": "true", "aria-errormessage": diagnosticId } : {},
            ),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged || update.selectionSet) {
                    onCursor?.(update.state);
                }
                if (update.docChanged) onEdit();
            }),
        ] : [EditorState.readOnly.of(true), EditorView.editable.of(false)]),
    ];
    const state = savedState ? EditorState.fromJSON(savedState, { extensions }, { history: historyField })
        : EditorState.create({ doc, extensions });
    const view = new EditorView({ parent, state });

    return {
        view,
        saveState: () => view.state.toJSON({ history: historyField }),
        setColumnGuide(width) {
            const style = view.contentDOM.style;
            if (width === undefined) style.removeProperty("--playground-guide-position");
            else style.setProperty("--playground-guide-position", `calc(var(--playground-code-inset) + ${width}ch)`);
        },
        markError(location, invalid = false) {
            const { doc } = view.state;
            const marks = [];
            if (location && location.line > 0 && location.line <= doc.lines) {
                const line = doc.line(location.line);
                const characters = Array.from(line.text);
                const column = location.column - 1;
                marks.push(errorLine.range(line.from));
                if (column >= 0 && column < characters.length) {
                    // The parser counts code points; CodeMirror positions are UTF-16 offsets.
                    const from = line.from + characters.slice(0, column).join("").length;
                    marks.push(errorCharacter.range(from, from + characters[column].length));
                }
            }
            view.dispatch({ effects: setErrorMarks.of({ marks: Decoration.set(marks, true), invalid }) });
        },
    };
}

export function flixTokenStyle({ light, dark }) {
    return `--flix-light:${light.color};--flix-dark:${dark.color}`;
}

export async function createFlixHighlighter() {
    const highlighter = await createHighlighterCore({
        langs: [{ ...grammar, name: "flix" }],
        themes: Object.values(flixThemes),
        engine: createOnigurumaEngine(import("shiki/wasm")),
    });
    const tokenize = (code) => highlighter.codeToTokensWithThemes(code, {
        lang: "flix",
        themes: { light: flixThemes.light.name, dark: flixThemes.dark.name },
    });
    const apply = (view) => {
        const tokens = tokenize(view.state.doc.toString());
        const marks = tokens.flatMap((line) => line.flatMap(({ content, offset, variants }) => {
            if (!content.trim()) return [];
            const style = flixTokenStyle(variants);
            return [Decoration.mark({ class: "flix-token", attributes: { style } }).range(offset, offset + content.length)];
        }));
        view.dispatch({ effects: setHighlighting.of(Decoration.set(marks)) });
    };
    return { apply, tokenize };
}
