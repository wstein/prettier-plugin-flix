import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, keymap, lineNumbers } from "@codemirror/view";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { flixThemes } from "./flix-themes.js";
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

export function createEditor(parent, onEdit) {
    const indentation = new Compartment();
    const view = new EditorView({
        parent,
        extensions: [
            lineNumbers(),
            drawSelection(),
            highlighting,
            indentation.of([EditorState.tabSize.of(4), indentUnit.of("    ")]),
            EditorView.contentAttributes.of({
                "aria-labelledby": `${parent.id}-label`,
                spellcheck: "false",
                autocapitalize: "off",
                ...(onEdit ? {} : { tabindex: "0", "aria-readonly": "true" }),
            }),
            ...(onEdit ? [
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) onEdit();
                }),
            ] : [EditorState.readOnly.of(true), EditorView.editable.of(false)]),
        ],
    });

    return {
        view,
        setTabWidth(width) {
            if (view.state.tabSize === width) return;
            // CodeMirror's indent unit is for interactive editing; the formatter takes the full width above.
            const spaces = " ".repeat(Math.min(width, 100));
            view.dispatch({ effects: indentation.reconfigure([EditorState.tabSize.of(width), indentUnit.of(spaces)]) });
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
