import { playgroundFlixVersions } from "./playground-options.js";
import { sourceReference } from "./playground-source.js";

export function writeHandoff(url, { source, printWidth, flixVersion, sourceUrl, sourceLines }) {
    const params = new URLSearchParams();
    if (source !== undefined) {
        const bytes = new TextEncoder().encode(source);
        const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
            .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
        params.set("code", encoded);
    }
    const reference = sourceReference(sourceUrl, sourceLines);
    if (reference) {
        params.set("sourceUrl", reference.sourceUrl);
        if (reference.sourceLines) params.set("sourceLines", reference.sourceLines);
    }
    if (printWidth !== undefined) params.set("printWidth", printWidth);
    if (flixVersion !== undefined) params.set("flixVersion", flixVersion);
    const link = new URL(url);
    link.hash = params.toString();
    return link.href;
}

export function readHandoff(hash) {
    const params = new URLSearchParams(hash.slice(1));
    const code = params.get("code");
    const reference = sourceReference(params.get("sourceUrl"), params.get("sourceLines"));
    if (code === null && !reference) return;
    try {
        let source;
        if (code !== null) {
            const binary = atob(code.replaceAll("-", "+").replaceAll("_", "/"));
            source = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
        }
        const printWidth = Number(params.get("printWidth"));
        const requested = params.get("flixVersion");
        const flixVersion = playgroundFlixVersions.includes(requested) ? requested : undefined;
        return {
            source,
            printWidth: Number.isSafeInteger(printWidth) && printWidth > 0 ? printWidth : undefined,
            flixVersion,
            ...(reference && { sourceUrl: reference.sourceUrl, sourceLines: reference.sourceLines }),
        };
    } catch {
        return undefined;
    }
}
