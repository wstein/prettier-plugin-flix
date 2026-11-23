/**
 * Rewrite docs URLs between the root catalog (latest pin) and
 * /flix/<exact-version>/ trees while keeping the page path after the prefix.
 *
 * `baseURL` must be the site root (Pages baseURL without /flix/<version>/).
 * resolveBasePath also strips a trailing version segment so a mistaken
 * catalog baseURL still navigates correctly.
 */

export function resolveBasePath(baseURL, href = "https://example.com/") {
    let basePath;
    try {
        basePath = new URL(baseURL, href).pathname;
    } catch {
        basePath = "/";
    }
    if (!basePath.endsWith("/")) basePath += "/";
    return basePath.replace(/flix\/\d+\.\d+\.\d+\/$/, "");
}

export function catalogRest(pathname, basePath) {
    let rest = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname.replace(/^\//, "");
    rest = rest.replace(/^flix\/\d+\.\d+\.\d+(?:\/|$)/, "");
    return rest;
}

export function urlForVersion(basePath, latest, version, rest) {
    const suffix = rest.startsWith("/") ? rest.slice(1) : rest;
    if (version === latest) {
        return `${basePath}${suffix}`;
    }
    return `${basePath}flix/${version}/${suffix}`;
}

/** Absolute path (+ search/hash) for a version change, or null when unchanged. */
export function navigateTarget({ baseURL, href, pathname, search = "", hash = "", latest, current, version }) {
    if (!version || !latest || version === current) return null;
    const basePath = resolveBasePath(baseURL, href);
    const rest = catalogRest(pathname, basePath);
    const next = urlForVersion(basePath, latest, version, rest);
    const target = `${next}${search}${hash}`;
    const here = `${pathname}${search}${hash}`;
    return target === here ? null : target;
}

function bindVersionSwitcher() {
    const picker = document.querySelector("#site-flix-version");
    if (!(picker instanceof HTMLSelectElement)) return;

    const baseURL = picker.dataset.baseUrl || "/";
    const latest = picker.dataset.latest;
    const current = picker.dataset.current || latest;
    if (!latest) return;

    picker.closest("label").hidden = false;
    if ([...picker.options].some((option) => option.value === current)) {
        picker.value = current;
    }

    picker.addEventListener("change", () => {
        const target = navigateTarget({
            baseURL,
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            latest,
            current,
            version: picker.value,
        });
        if (target) window.location.assign(target);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindVersionSwitcher);
    } else {
        bindVersionSwitcher();
    }
}
