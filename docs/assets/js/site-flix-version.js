(() => {
    /**
     * Rewrite the current docs URL between the root catalog (latest pin) and
     * /flix/<exact-version>/ trees while keeping the page path after the prefix.
     */
    function catalogRest(pathname, basePath) {
        let rest = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname.replace(/^\//, "");
        rest = rest.replace(/^flix\/\d+\.\d+\.\d+(?:\/|$)/, "");
        return rest;
    }

    function urlForVersion(basePath, latest, version, rest) {
        const suffix = rest.startsWith("/") ? rest.slice(1) : rest;
        if (version === latest) {
            return `${basePath}${suffix}`;
        }
        return `${basePath}flix/${version}/${suffix}`;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const picker = document.querySelector("#site-flix-version");
        if (!(picker instanceof HTMLSelectElement)) return;

        const baseURL = picker.dataset.baseUrl || "/";
        const latest = picker.dataset.latest;
        const current = picker.dataset.current || latest;
        if (!latest) return;

        let basePath;
        try {
            basePath = new URL(baseURL, window.location.href).pathname;
        } catch {
            basePath = "/";
        }
        if (!basePath.endsWith("/")) basePath += "/";

        if ([...picker.options].some((option) => option.value === current)) {
            picker.value = current;
        }

        picker.addEventListener("change", () => {
            const version = picker.value;
            if (!version || version === current) return;
            const rest = catalogRest(window.location.pathname, basePath);
            const next = urlForVersion(basePath, latest, version, rest);
            const target = `${next}${window.location.search}${window.location.hash}`;
            if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
                window.location.assign(target);
            }
        });
    });
})();
