import { writeHandoff } from "./playground-link.js";

const guide = document.querySelector("[data-example-guide]");
const template = guide.querySelector("#guide-workbench");
const drafts = new Map();
let examples;
let workbench;
let active;
let request = 0;

function closeExample() {
    if (!active) return;
    const { card, button, editor, panel } = active;
    drafts.set(card.dataset.example, editor.snapshot());
    editor.destroy();
    panel.replaceChildren();
    panel.hidden = true;
    card.querySelector(".guide-static").hidden = false;
    button.textContent = "Try it live";
    button.setAttribute("aria-expanded", "false");
    active = undefined;
}

for (const button of guide.querySelectorAll(".guide-edit")) button.hidden = false;

guide.addEventListener("click", async (event) => {
    const button = event.target.closest(".guide-edit");
    if (!button) return;
    const id = ++request;
    const card = button.closest(".guide-example");
    const status = card.querySelector(".guide-status");
    if (active?.card === card) {
        closeExample();
        return;
    }
    closeExample();
    button.disabled = true;
    try {
        examples ??= fetch(guide.dataset.examples).then((response) => {
            if (!response.ok) throw new Error("Example data is unavailable.");
            return response.json();
        });
        workbench ??= import(guide.dataset.workbench);
        const [data, { mountWorkbench }] = await Promise.all([examples, workbench]);
        if (request !== id) return;

        const key = card.dataset.example;
        const { input: source, options } = data.fixtures[key];
        const initial = drafts.get(key) ?? { source, ...options[0] };
        const panel = card.querySelector(".guide-live");
        const link = card.querySelector("[data-handoff]");
        const originalLink = link.href;
        panel.append(template.content.cloneNode(true));
        panel.hidden = false;
        const editor = mountWorkbench(panel.firstElementChild, {
            initial,
            onChange: (draft) => { link.href = writeHandoff(originalLink, draft); },
        });
        active = { card, button, editor, panel };
        card.querySelector(".guide-static").hidden = true;
        button.textContent = "Close editor";
        button.setAttribute("aria-expanded", "true");
        status.textContent = "";
        editor.focus();
    } catch {
        status.textContent = "The live editor could not load. Try opening the Playground.";
    } finally {
        button.disabled = false;
    }
});
