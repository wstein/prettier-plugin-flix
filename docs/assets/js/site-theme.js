(() => {
    const key = "flix-docs-theme";
    const root = document.documentElement;
    let theme = "system";

    try {
        const saved = localStorage.getItem(key);
        if (saved === "light" || saved === "dark") theme = saved;
    } catch {
        // Storage can be unavailable in private or restricted contexts.
    }
    root.dataset.theme = theme;

    document.addEventListener("DOMContentLoaded", () => {
        const picker = document.querySelector("#site-theme");
        picker.value = theme;
        picker.addEventListener("change", () => {
            root.dataset.theme = picker.value;
            try {
                localStorage.setItem(key, picker.value);
            } catch {
                // The selection still applies to the current page.
            }
        });
    });
})();
