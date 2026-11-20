const deadline = 5000;
let worker;
const pending = new Map();

function reset(failedWorker, failure) {
    if (worker !== failedWorker) return;
    worker.terminate();
    worker = undefined;
    const requests = [...pending.values()];
    pending.clear();
    for (const { timer, receive } of requests) {
        clearTimeout(timer);
        receive({ failure });
    }
}

export function requestFormat(url, request, receive) {
    try {
        if (!worker) {
            const current = new Worker(url, { type: "module" });
            worker = current;
            current.addEventListener("error", () => reset(current, "load"));
            current.addEventListener("message", ({ data }) => {
                if (worker !== current) return;
                if (data.failure === "load") return reset(current, "load");
                const request = pending.get(data.id);
                if (!request) return;
                pending.delete(data.id);
                clearTimeout(request.timer);
                request.receive(data);
            });
        }
        const current = worker;
        const timer = setTimeout(() => reset(current, "timeout"), deadline);
        pending.set(request.id, { timer, receive });
        current.postMessage(request);
    } catch {
        if (worker) reset(worker, "load");
        else receive({ failure: "load" });
    }
}
