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

function settle(id, data) {
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    clearTimeout(request.timer);
    request.receive(data);
}

/** @param {typeof Worker} [WorkerImpl] injectable for tests */
export function requestFormat(url, request, receive, WorkerImpl = globalThis.Worker) {
    try {
        if (!worker) {
            const current = new WorkerImpl(url, { type: "module" });
            worker = current;
            current.addEventListener("error", () => reset(current, "load"));
            current.addEventListener("message", ({ data }) => {
                if (worker !== current) return;
                // A load failure is per request: keep the worker so the next format can
                // retry the grammar import in the same realm (browser-grammar cache).
                settle(data.id, data);
            });
        }
        const current = worker;
        const timer = setTimeout(() => reset(current, "timeout"), deadline);
        pending.set(request.id, { timer, receive });
        current.postMessage(request);
        return () => {
            clearTimeout(timer);
            pending.delete(request.id);
        };
    } catch {
        if (worker) reset(worker, "load");
        else receive({ failure: "load" });
    }
}

/** Test helper: drop the shared worker between cases. */
export function resetRequestFormatForTests() {
    if (worker) {
        worker.terminate();
        worker = undefined;
    }
    for (const { timer } of pending.values()) clearTimeout(timer);
    pending.clear();
}
