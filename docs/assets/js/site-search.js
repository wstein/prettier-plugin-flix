const form = document.querySelector(".site-search");
const input = form.querySelector("#site-search-query");
const dropdown = form.querySelector("#site-search-dropdown");
const status = form.querySelector(".site-search-status");
const results = form.querySelector(".site-search-results");

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
    if (count === 0) status.textContent = "No results found.";
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
        const response = await fetch(form.dataset.index);
        if (!response.ok) throw new Error("Search index unavailable.");
        const data = await response.json();
        entries = data.map((entry) => ({
            ...entry,
            titleKey: normalize(entry.title),
            searchable: normalize([entry.title, entry.chapter, entry.group, entry.description, entry.path, entry.source].join(" ")),
        }));
        render();
    } catch {
        status.textContent = "Search could not load. Change your query to retry.";
    } finally {
        loading = false;
    }
}

function setExpanded(expanded) {
    dropdown.hidden = !expanded;
    input.setAttribute("aria-expanded", String(expanded));
}

function showResults() {
    setExpanded(Boolean(input.value.trim()));
    if (dropdown.hidden) return;
    if (entries) render();
    else void loadIndex();
}

form.hidden = false;
input.addEventListener("focus", showResults);
input.addEventListener("input", showResults);
input.addEventListener("click", () => {
    if (dropdown.hidden) showResults();
});

form.addEventListener("focusout", (event) => {
    if (!form.contains(event.relatedTarget)) setExpanded(false);
});
document.addEventListener("pointerdown", (event) => {
    if (!form.contains(event.target)) setExpanded(false);
});

form.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dropdown.hidden) {
        event.preventDefault();
        input.focus();
        setExpanded(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (dropdown.hidden) showResults();
        if (dropdown.hidden) return;
        const links = [...results.querySelectorAll("a")];
        const active = links.indexOf(document.activeElement);
        event.preventDefault();
        if (event.key === "ArrowDown") links[active + 1]?.focus();
        else if (active === 0) input.focus();
        else links[active < 0 ? links.length - 1 : active - 1]?.focus();
    }
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (dropdown.hidden) showResults();
    else results.querySelector("a")?.click();
});

results.addEventListener("click", (event) => {
    if (event.target.closest("a")) setExpanded(false);
});
