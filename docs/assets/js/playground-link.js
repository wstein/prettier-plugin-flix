export function writeHandoff(url, { source, printWidth, tabWidth, useTabs }) {
    const bytes = new TextEncoder().encode(source);
    const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
        .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    const params = new URLSearchParams({ code: encoded, printWidth, tabWidth, useTabs: String(useTabs) });
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
        const tabWidth = Number(params.get("tabWidth"));
        return {
            source,
            printWidth: Number.isSafeInteger(printWidth) && printWidth > 0 ? printWidth : 80,
            tabWidth: Number.isSafeInteger(tabWidth) && tabWidth > 0 ? tabWidth : 4,
            useTabs: params.get("useTabs") === "true",
        };
    } catch {
        return undefined;
    }
}
