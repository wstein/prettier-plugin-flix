import { formatFlix } from "./format-flix.js";

const form = document.querySelector(".playground");
const controls = form.querySelector("fieldset");
const input = form.querySelector("#flix-input");
const output = form.querySelector("#flix-output");
const printWidth = form.querySelector("#print-width");
const tabWidth = form.querySelector("#tab-width");
const useTabs = form.querySelector("#use-tabs");
const status = form.querySelector(".playground-status");
const exampleLabel = form.querySelector(".playground-example");
const copy = form.querySelector(".playground-copy");

async function formatInput() {
    if (!form.reportValidity()) return;
    status.textContent = "Formatting…";
    copy.disabled = true;
    controls.disabled = true;
    try {
        output.value = await formatFlix(input.value, {
            printWidth: printWidth.valueAsNumber,
            tabWidth: tabWidth.valueAsNumber,
            useTabs: useTabs.checked,
        });
        output.style.tabSize = tabWidth.value;
        copy.disabled = output.value.length === 0;
        status.textContent = "Formatting complete.";
    } catch (error) {
        output.value = "";
        const location = error.loc?.start;
        status.textContent = location
            ? `Line ${location.line}, column ${location.column}. ${error.message}`
            : `Formatting failed. ${error.message}`;
    } finally {
        controls.disabled = false;
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    void formatInput();
});

form.addEventListener("input", () => {
    if (!copy.disabled) {
        copy.disabled = true;
        status.textContent = "Format again to update the output.";
    }
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        form.requestSubmit();
    }
});

copy.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(output.value);
        status.textContent = "Copied to clipboard.";
    } catch {
        output.focus();
        output.select();
        status.textContent = "Output selected. Use your copy shortcut.";
    }
});

async function loadExample() {
    try {
        const response = await fetch(form.dataset.examples);
        if (!response.ok) throw new Error("The fixture data is unavailable.");
        const { defaultFixture, fixtures } = await response.json();
        const params = new URLSearchParams(location.search);
        const requested = params.get("fixture");
        const fixture = fixtures[Object.hasOwn(fixtures, requested) ? requested : defaultFixture];
        const variant = Number(params.get("variant"));
        const options = fixture.options[variant] ?? fixture.options[0];
        input.value = fixture.input;
        printWidth.value = options.printWidth ?? 80;
        tabWidth.value = options.tabWidth ?? 4;
        useTabs.checked = options.useTabs ?? false;
        exampleLabel.textContent = fixture.title;
        exampleLabel.hidden = false;
        controls.disabled = false;
        await formatInput();
    } catch {
        status.textContent = "The example could not load. Paste Flix code to get started.";
        controls.disabled = false;
    }
}

void loadExample();
