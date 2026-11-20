export function writeHandoff(url, { source, printWidth }) {
    const bytes = new TextEncoder().encode(source);
    const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
        .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    const params = new URLSearchParams({ code: encoded, printWidth });
    const link = new URL(url);
    link.hash = params.toString();
    return link.href;
}

export function readHandoff(hash) {
    const params = new URLSearchParams(hash.slice(1));
    const code = params.get("code");
    if (code === null) return;
    try {
        const binary = atob(code.replaceAll("-", "+").replaceAll("_", "/"));
        const source = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
        const printWidth = Number(params.get("printWidth"));
        return {
            source,
            printWidth: Number.isSafeInteger(printWidth) && printWidth > 0 ? printWidth : undefined,
        };
    } catch {
        return undefined;
    }
}
