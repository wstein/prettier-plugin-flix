const button = document.querySelector(".site-search-trigger");
const dialog = document.querySelector("#site-search");
const form = dialog.querySelector(".site-search-form");
const input = dialog.querySelector("#site-search-query");
const status = dialog.querySelector(".site-search-status");
const results = dialog.querySelector(".site-search-results");

let entries;
let loading;

function normalize(text) {
    return text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

function render() {
    if (!entries) return;
    results.replaceChildren();
    const query = normalize(input.value.trim());
    if (!query) {
        status.textContent = "";
        return;
    }

    const terms = query.split(/\s+/);
    const matches = entries
        .filter(({ searchable }) => terms.every((term) => searchable.includes(term)))
        .map((entry) => ({
            entry,
            score: (entry.titleKey.includes(query) ? 4 : 0)
                + terms.filter((term) => entry.titleKey.includes(term)).length,
        }))
        .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

    const count = matches.length;
    const shown = matches.slice(0, 20);
    if (count === 0) status.textContent = "No matching fixtures.";
    else if (count > shown.length) status.textContent = `Showing the first ${shown.length} of ${count} results.`;
    else status.textContent = `${count} ${count === 1 ? "result" : "results"}.`;

    for (const { entry } of shown) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const title = document.createElement("strong");
        const chapter = document.createElement("span");
        link.href = entry.href;
        title.textContent = entry.title;
        chapter.textContent = entry.chapter;
        link.append(title, chapter);
        item.append(link);
        results.append(item);
    }
}

async function loadIndex() {
    if (entries || loading) return;
    loading = true;
    status.textContent = "Loading search…";
    try {
        const response = await fetch(dialog.dataset.index);
        if (!response.ok) throw new Error("Search index unavailable.");
        const data = await response.json();
        entries = data.map((entry) => ({
            ...entry,
            titleKey: normalize(entry.title),
            searchable: normalize([entry.title, entry.chapter, entry.group, entry.description, entry.path, entry.source].join(" ")),
        }));
        render();
    } catch {
        status.textContent = "Search could not load. Reopen the dialog to try again.";
    } finally {
        loading = false;
    }
}

button.hidden = false;
button.addEventListener("click", () => {
    dialog.showModal();
    input.focus();
    void loadIndex();
});

input.addEventListener("input", render);

dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    dialog.close();
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    results.querySelector("a")?.click();
});

results.addEventListener("click", (event) => {
    if (event.target.closest("a")) dialog.close();
});
