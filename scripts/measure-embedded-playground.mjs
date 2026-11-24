// Measure mounted editor cost in a built catalog chapter with Chromium.
import { chromium } from "@playwright/test";

const [url] = process.argv.slice(2);
if (!url) {
    console.error("Usage: node scripts/measure-embedded-playground.mjs <catalog-chapter-url>");
    process.exit(2);
}

const editor = "[data-embedded-playground]";
const viewport = { width: 1280, height: 800 };
const samples = 3;
const revisits = 3;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });

async function measure() {
    const page = await browser.newPage({ viewport });
    try {
        const session = await page.context().newCDPSession(page);
        await session.send("Performance.enable");
        await page.goto(url, { waitUntil: "load" });
        const editors = page.locator(editor);
        const total = await editors.count();
        if (total < 2) throw new Error("The chapter needs multiple embedded examples");
        await editors.first().locator(".cm-editor").first().waitFor();

        const nextPaint = () => page.evaluate(() => new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const snapshot = async () => {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await nextPaint();
            await session.send("HeapProfiler.collectGarbage");
            const { metrics } = await session.send("Performance.getMetrics");
            const { nodes, jsEventListeners } = await session.send("Memory.getDOMCounters");
            return {
                mounted: await page.locator(`${editor}:has(.cm-editor)`).count(),
                heapBytes: metrics.find(({ name }) => name === "JSHeapUsedSize").value,
                nodes,
                listeners: jsEventListeners,
                workers: page.workers().length,
            };
        };
        const visit = async (index) => {
            const embedded = editors.nth(index);
            await embedded.evaluate((node) =>
                node.closest(".fixture").scrollIntoView({ block: "center", behavior: "instant" }));
            await embedded.locator(".cm-editor").first().waitFor();
            await nextPaint();
        };
        const walk = async () => {
            for (let index = 0; index < total; index++) await visit(index);
        };

        const initial = await snapshot();
        await walk();
        const visited = await snapshot();
        const returned = [];
        for (let round = 0; round < revisits; round++) {
            await walk();
            returned.push(await snapshot());
        }
        return { total, initial, visited, returned };
    } finally {
        await page.context().close();
    }
}

try {
    const runs = [];
    for (let index = 0; index < samples; index++) runs.push(await measure());
    console.log(JSON.stringify({ url, chromium: browser.version(), viewport, runs }, null, 2));
} finally {
    await browser.close();
}
