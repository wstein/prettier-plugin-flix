/** Exact Flix compiler versions the plugin can parse today. */
export const SUPPORTED_FLIX_VERSIONS = ["0.80.0"] as const;

export type FlixVersion = (typeof SUPPORTED_FLIX_VERSIONS)[number];

/** Grammar used when `flixVersion` is omitted from Prettier options. */
export const DEFAULT_FLIX_VERSION: FlixVersion = "0.80.0";

/**
 * Stable id for the generated grammar bundle that implements a Flix version.
 * Today every supported version maps to the single shipped grammar; a future
 * syntax-changing release adds another id and generated tree.
 */
export type FlixGrammarId = "flix-0.80.0";

const GRAMMAR_BY_VERSION: Record<FlixVersion, FlixGrammarId> = {
    "0.80.0": "flix-0.80.0",
};

function supportedList(): string {
    return SUPPORTED_FLIX_VERSIONS.join(", ");
}

/** Resolve a Prettier `flixVersion` value to a supported exact version. */
export function resolveFlixVersion(value: unknown): FlixVersion {
    if (value === undefined || value === null || value === "") return DEFAULT_FLIX_VERSION;
    if (typeof value !== "string") {
        throw new Error(
            `flixVersion must be an exact Flix compiler version string (supported: ${supportedList()}).`,
        );
    }
    if ((SUPPORTED_FLIX_VERSIONS as readonly string[]).includes(value)) {
        return value as FlixVersion;
    }
    throw new Error(`Unsupported flixVersion "${value}". Supported: ${supportedList()}.`);
}

/** Grammar bundle to load for a resolved Flix version. */
export function grammarIdForVersion(version: FlixVersion): FlixGrammarId {
    return GRAMMAR_BY_VERSION[version];
}
