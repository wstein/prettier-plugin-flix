const commitHash = /^[0-9a-f]{40}$/i;

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
        const github = !url.port && (raw || blob) && owner && repository && path.length && path.every(Boolean);
        const filename = decodeURIComponent(parts.at(-1) || url.hostname);
        let href = url.href;
        if (github) {
            const anchor = sourceLines ? "#L" + sourceLines.replace("-", "-L") : "";
            href = `https://github.com/${owner}/${repository}/blob/${revision}/${path.join("/")}${anchor}`;
        }
        return { sourceUrl: url.href, sourceLines, href, filename };
    } catch {
        return;
    }
}
