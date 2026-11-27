import assert from "node:assert/strict";
import test from "node:test";
import {
    requestFormat,
    resetRequestFormatForTests,
} from "../docs/assets/js/playground-requests.js";

class FakeWorker {
    static instances = [];

    constructor(url) {
        this.url = url;
        this.terminated = false;
        this.listeners = { error: [], message: [] };
        this.messages = [];
        FakeWorker.instances.push(this);
    }

    addEventListener(type, fn) {
        this.listeners[type].push(fn);
    }

    postMessage(data) {
        this.messages.push(data);
    }

    terminate() {
        this.terminated = true;
    }

    emit(type, event) {
        for (const fn of this.listeners[type]) fn(event);
    }
}

test.beforeEach(() => {
    FakeWorker.instances = [];
    resetRequestFormatForTests();
});

test("a load failure keeps the worker so the next request can retry in-process", async () => {
    const failures = [];
    const successes = [];

    requestFormat(
        "worker.js",
        { id: 1, source: "def a(): Int32 = 1", options: {}, asset: "format.js" },
        (data) => failures.push(data),
        FakeWorker,
    );
    assert.equal(FakeWorker.instances.length, 1);
    const first = FakeWorker.instances[0];
    first.emit("message", { data: { id: 1, failure: "load" } });
    assert.deepEqual(failures, [{ id: 1, failure: "load" }]);
    assert.equal(first.terminated, false);

    requestFormat(
        "worker.js",
        { id: 2, source: "def a(): Int32 = 1", options: {}, asset: "format.js" },
        (data) => successes.push(data),
        FakeWorker,
    );
    assert.equal(FakeWorker.instances.length, 1, "reuses the living worker");
    first.emit("message", { data: { id: 2, output: "def a(): Int32 = 1" } });
    assert.deepEqual(successes, [{ id: 2, output: "def a(): Int32 = 1" }]);
    assert.equal(first.terminated, false);
});

test("a worker error event still terminates and fails pending requests", () => {
    const results = [];
    requestFormat(
        "worker.js",
        { id: 3, source: "x", options: {}, asset: "format.js" },
        (data) => results.push(data),
        FakeWorker,
    );
    const current = FakeWorker.instances[0];
    current.emit("error", {});
    assert.equal(current.terminated, true);
    assert.deepEqual(results, [{ failure: "load" }]);
});
