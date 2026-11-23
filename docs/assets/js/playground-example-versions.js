/**
 * Version ranges for curated Playground examples.
 *
 * - `minVersion` alone: available from that pin onward (from-version).
 * - `minVersion` + `maxVersion`: inclusive from–to range.
 * - Neither: available under every supported pin.
 *
 * This is syntax-pin filtering only — not a language feature matrix.
 */

/** @param {string} version */
function parts(version) {
    return version.split(".").map(Number);
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
export function compareFlixVersions(left, right) {
    const a = parts(left);
    const b = parts(right);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const delta = (a[i] ?? 0) - (b[i] ?? 0);
        if (delta !== 0) return delta < 0 ? -1 : 1;
    }
    return 0;
}

/**
 * @param {{ minVersion?: string, maxVersion?: string } | undefined} range
 * @param {string} version
 */
export function exampleSupportsVersion(range, version) {
    if (range?.minVersion && compareFlixVersions(version, range.minVersion) < 0) return false;
    if (range?.maxVersion && compareFlixVersions(version, range.maxVersion) > 0) return false;
    return true;
}

/**
 * @param {{ title: string, examples: [string, string][] }[]} groups
 * @param {Record<string, { minVersion?: string, maxVersion?: string }>} fixtures
 * @param {string} version
 */
export function filterExampleGroups(groups, fixtures, version) {
    return groups.flatMap(({ title, examples }) => {
        const kept = examples.filter(([, path]) => exampleSupportsVersion(fixtures[path], version));
        return kept.length > 0 ? [{ title, examples: kept }] : [];
    });
}

/**
 * Normalize a playground menu entry to `[label, path]` plus an optional range.
 * @param {[string, string] | [string, string, { minVersion?: string, maxVersion?: string }]} entry
 */
export function readExampleEntry(entry) {
    const [label, path, range] = entry;
    const minVersion = range?.minVersion;
    const maxVersion = range?.maxVersion;
    if (minVersion !== undefined && typeof minVersion !== "string") {
        throw new Error(`Playground example ${path}: minVersion must be a string`);
    }
    if (maxVersion !== undefined && typeof maxVersion !== "string") {
        throw new Error(`Playground example ${path}: maxVersion must be a string`);
    }
    if (minVersion !== undefined && maxVersion !== undefined && compareFlixVersions(minVersion, maxVersion) > 0) {
        throw new Error(`Playground example ${path}: minVersion ${minVersion} is after maxVersion ${maxVersion}`);
    }
    return {
        label,
        path,
        ...(minVersion !== undefined ? { minVersion } : {}),
        ...(maxVersion !== undefined ? { maxVersion } : {}),
    };
}
