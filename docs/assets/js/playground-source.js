const commitHash = /^[0-9a-f]{40}$/i;
const repositorySegment = /^[a-z0-9_.-]+$/i;

function parseLines(value) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(value ?? "");
    if (!match) return;
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    if (first > 0 && last >= first && Number.isSafeInteger(last)) {
        return first === last ? String(first) : `${first}-${last}`;
    }
}

export function sourceReference(value, lines) {
    if (!value) return;
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password) return;
        const lineAnchor = /^#L(\d+)(?:-L(\d+))?$/.exec(url.hash);
        const sourceLines = parseLines(lines || lineAnchor?.slice(1).filter(Boolean).join("-"));
        const parts = url.pathname.split("/").slice(1);
        const [owner, repository, kind, commit, ...file] = parts;
        const raw = url.hostname === "raw.githubusercontent.com" && commitHash.test(kind);
        const blob = url.hostname === "github.com" && kind === "blob" && commitHash.test(commit);
        const revision = raw ? kind : commit;
        const path = raw ? parts.slice(3) : file;
        const github = !url.port && (raw || blob) &&
            repositorySegment.test(owner ?? "") && repositorySegment.test(repository ?? "") &&
            path.length && path.every(Boolean);
        const filename = decodeURIComponent(parts.at(-1) || url.hostname);
        let href = url.href;
        let downloadUrl;
        if (github) {
            const anchor = sourceLines ? "#L" + sourceLines.replace("-", "-L") : "";
            href = `https://github.com/${owner}/${repository}/blob/${revision}/${path.join("/")}${anchor}`;
            if (!url.search && !path.some((part) => /%2f|%5c/i.test(part))) {
                downloadUrl = `https://raw.githubusercontent.com/${owner}/${repository}/${revision}/${path.join("/")}`;
            }
        }
        return { sourceUrl: url.href, sourceLines, href, filename, downloadUrl };
    } catch {
        return;
    }
}


function requestSignal(signal) {
    const timeout = AbortSignal.timeout(10_000);
    if (!signal) return timeout;
    if (AbortSignal.any) return AbortSignal.any([signal, timeout]);
    if (signal.aborted) return signal;

    const fallback = new AbortController();
    for (const source of [signal, timeout]) {
        source.addEventListener("abort", () => fallback.abort(source.reason), {
            once: true,
            signal: fallback.signal,
        });
    }
    return fallback.signal;
}

export async function fetchSource(url, signal) {
    const response = await fetch(url, {
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: requestSignal(signal),
    });
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
    if (!response.body || response.headers.get("content-type")?.startsWith("text/html")) {
        throw new Error("GitHub did not return a source file.");
    }

    const decoder = new TextDecoder("utf-8", { fatal: true });
    const reader = response.body.getReader();
    let bytes = 0;
    let source = "";
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done) return source + decoder.decode();
            bytes += value.byteLength;
            if (bytes > 1024 * 1024) throw new Error("The source file exceeds 1 MiB.");
            source += decoder.decode(value, { stream: true });
        }
    } finally {
        await reader.cancel().catch(() => {});
    }
}
