import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const siteRoot = fileURLToPath(new URL("../docs/public", import.meta.url));
const basePath = "/prettier-plugin-flix/";
const contentTypes = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
};

let server;
let siteUrl;
let unavailableFormatter = false;

// Keep the same base path as GitHub Pages so fixture URLs and worker imports
// exercise the files that will actually be deployed.
test.beforeAll(async () => {
    await readFile(resolve(siteRoot, "playground/index.html"));
    server = createServer(async (request, response) => {
        try {
            const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
            if (unavailableFormatter && /\/format-flix\.[a-f0-9]+\.js$/.test(path)) {
                response.writeHead(404).end();
                return;
            }
            const relative = path.slice(basePath.length);
            const file = resolve(siteRoot, relative, ...(path.endsWith("/") ? ["index.html"] : []));
            if (!path.startsWith(basePath) || !file.startsWith(siteRoot + sep)) {
                response.writeHead(404).end();
                return;
            }
            const body = await readFile(file);
            response.writeHead(200, {
                "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
            }).end(body);
        } catch (error) {
            response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
        }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    siteUrl = `http://127.0.0.1:${server.address().port}${basePath}`;
});

test.afterAll(async () => {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
});

test.use({
    browserName: "chromium",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
});

test("catalog and Playground publish share previews and keep the mobile brand link compact", async ({ page }) => {
    const deployedOrigin = "https://wstein.github.io";
    await page.setViewportSize({ width: 320, height: 760 });

    for (const [path, catalogPath] of [
        ["", ""],
        ["formatting/", ""],
        ["flix/0.80.0/playground/", "flix/0.80.0/"],
    ]) {
        await page.goto(siteUrl + path);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", await page.title());
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", deployedOrigin + basePath + path);
        const image = basePath + catalogPath + "branding/social-preview.png";
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", deployedOrigin + image);
        expect((await page.request.get(new URL(image, siteUrl).href)).ok()).toBe(true);

        const toolbar = page.getByRole("navigation", { name: "Site" });
        const brand = toolbar.getByRole("link", { name: "Prettier Plugin for Flix", exact: true });
        const logo = brand.locator("img");
        await expect(logo).toHaveAttribute("alt", "");
        await expect(logo).toHaveAttribute("src", basePath + catalogPath + "branding/favicon.svg");
        await expect(logo).toHaveJSProperty("naturalWidth", 16);
        expect((await logo.boundingBox()).width).toBe(20);
        expect(await toolbar.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(320);
    }
});

test("inline search finds both documentation pages and still finds fixtures", async ({ page }) => {
    await page.goto(siteUrl);
    const search = page.getByRole("search", { name: "Catalog" });
    const input = search.getByRole("searchbox");
    const results = search.locator(".site-search-dropdown");

    await input.fill("formatting style");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const style = results.getByRole("link", { name: /Flix formatting style/ });
    await expect(style).toHaveAttribute("href", basePath + "formatting/");
    await input.press("ArrowDown");
    await expect(style).toBeFocused();
    await style.press("Enter");
    await expect(page).toHaveURL(/\/formatting\/$/);

    await page.setViewportSize({ width: 390, height: 760 });
    await input.fill("comprehensions and parallel bindings");
    await expect(style).toBeVisible();
    await input.press("Escape");
    await expect(results).toBeHidden();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toBeFocused();

    await input.fill("before and after");
    await expect(results.getByRole("link", { name: /Before and after/ })).toHaveAttribute("href", basePath + "examples/");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/examples\/$/);

    await input.fill("block comments at the end of a line");
    await expect(results.getByRole("link", { name: /Block comments at the end of a line/ }))
        .toHaveAttribute("href", basePath + "comments/#trailing-block-comment");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await input.clear();
    await expect(results).toBeHidden();
});

test("the catalog gives embedded editors room and aligns the header with the chapters", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Before and after", exact: true });
    const chapters = page.getByRole("navigation", { name: "Documentation" });
    const siteLink = page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Prettier Plugin for Flix" });
    const fixture = page.locator("[data-embedded-playground]").first();
    const input = fixture.locator(".playground-pane").first();
    const preview = fixture.locator(".playground-pane").last();

    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(siteUrl + "examples/");
    await expect(heading).toBeVisible();
    const guide = chapters.getByRole("list", { name: "Start here" });
    await expect(guide.getByRole("link")).toHaveText(["Formatting style", "Before and after", "Playground"]);
    await expect(guide.getByRole("link", { name: "Before and after" })).toHaveAttribute("aria-current", "page");
    const constructs = chapters.getByRole("list", { name: "By construct" });
    await expect(constructs.locator(":scope > li > a")).toHaveText(["Declarations", "Expressions", "Datalog", "Strings"]);
    await expect(constructs.getByRole("list", { name: "Declarations" }).getByRole("link"))
        .toHaveText(["Modules and members", "Signatures and effect sets", "Types and constraints"]);
    await expect(constructs.getByRole("list", { name: "Expressions" }).getByRole("link"))
        .toHaveText(["Calls and pipelines", "Operators and control flow", "Alignment", "Other constructs"]);
    await expect(chapters.getByRole("list", { name: "Cross-cutting" }).getByRole("link"))
        .toHaveText(["Comments", "Whitespace-sensitive syntax", "Syntax errors", "Options"]);
    await expect(fixture.getByRole("textbox", { name: "Flix input" })).toBeVisible();
    expect((await siteLink.boundingBox()).x).toBeCloseTo((await chapters.boundingBox()).x, 0);
    expect((await input.boundingBox()).y).toBeCloseTo((await preview.boundingBox()).y, 0);

    for (const width of [1120, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(guide.getByRole("link", { name: "Formatting style" })).toBeVisible();
        expect((await preview.boundingBox()).y).toBeGreaterThan((await input.boundingBox()).y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }

    for (const catalog of ["", "flix/0.80.0/"]) {
        await page.goto(siteUrl + catalog + "examples/");
        for (const chapter of ["Declarations", "Expressions"]) {
            const links = constructs.getByRole("list", { name: chapter }).getByRole("link");
            const sections = await links.evaluateAll((items) => items.map(({ href, textContent }) => [href, textContent]));
            for (const [href, title] of sections) {
                expect(href).toContain(siteUrl + catalog + chapter.toLowerCase() + "/#");
                await page.goto(href);
                await expect(page.locator(":target")).toHaveText(title);
            }
        }
    }
});

test("both editors move their column guide with the configured width and horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1250, height: 850 });
    await page.goto(siteUrl + "playground/");
    const width = page.getByLabel("Line width");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const editors = [input, preview];

    async function expectGuide(editor, columns) {
        const { position, expected } = await editor.evaluate((content, columns) => {
            const lineStyle = getComputedStyle(content.querySelector(".cm-line"));
            const context = document.createElement("canvas").getContext("2d");
            context.font = lineStyle.font;
            return {
                position: parseFloat(getComputedStyle(content).backgroundPositionX),
                expected: parseFloat(lineStyle.paddingLeft) + context.measureText("0".repeat(columns)).width,
            };
        }, columns);
        expect(Math.abs(position - expected)).toBeLessThan(1);
    }

    await expect(width).toHaveValue("100");
    const literal = "x".repeat(240);
    await input.fill(`def message(): String = "${literal}"`);
    await expect(preview).toContainText(literal);
    for (const editor of editors) await expectGuide(editor, 100);

    await width.fill("80");
    for (const editor of editors) {
        await expectGuide(editor, 80);
        const scrolled = await editor.evaluate((content) => {
            const scroller = content.closest(".cm-scroller");
            const guide = () => content.getBoundingClientRect().left +
                parseFloat(getComputedStyle(content).backgroundPositionX);
            scroller.scrollLeft = 0;
            const before = guide();
            scroller.scrollLeft = 240;
            return { delta: before - guide(), scrollLeft: scroller.scrollLeft };
        });
        expect(scrolled.scrollLeft).toBeGreaterThan(0);
        expect(scrolled.delta).toBeCloseTo(scrolled.scrollLeft);
    }

    const theme = page.getByLabel("Theme");
    await theme.selectOption("light");
    const light = await input.evaluate((content) => getComputedStyle(content).backgroundImage);
    await theme.selectOption("dark");
    const dark = await input.evaluate((content) => getComputedStyle(content).backgroundImage);
    expect(light).not.toBe("none");
    expect(dark).not.toBe("none");
    expect(dark).not.toBe(light);

    await page.getByRole("button", { name: "Diff", exact: true }).click();
    await expect(preview).toBeHidden();
    await page.getByRole("button", { name: "Formatted", exact: true }).click();
    await expectGuide(preview, 80);
    await width.clear();
    for (const editor of editors) await expect(editor).toHaveCSS("background-position-x", "-1px");
});

test("sync scroll follows matching code in both directions across formatting changes", async ({ page }) => {
    await page.setViewportSize({ width: 1450, height: 850 });
    await page.goto(siteUrl + "playground/");
    await expect(page.getByLabel("Example")).toBeEnabled();
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const header = page.locator(".playground-preview-header");
    const toggle = header.getByRole("checkbox", { name: "Sync scroll" });
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    const lines = [
        ...Array.from({ length: 10 }, (_, i) =>
            `def prep${i}(): Int32 = { let first = ${i}; let second = 1; first + second }`),
        ...Array.from({ length: 60 }, (_, i) => `def checkpoint${i}(): Int32 = ${i}`),
    ];
    await input.fill(lines.join("\n") + "\n");
    await expect(status).toHaveText("");
    const scrollTop = (editor) => editor.evaluate((content) => content.closest(".cm-scroller").scrollTop);
    const topLine = (editor) => editor.evaluate((content) => {
        const top = content.closest(".cm-scroller").getBoundingClientRect().top;
        return [...content.querySelectorAll(".cm-line")]
            .find((line) => line.getBoundingClientRect().bottom > top + 2)?.textContent;
    });
    const scrollBeforeLine = (editor, lineIndex) => editor.evaluate((content, index) => {
        const line = content.querySelector(".cm-line");
        const padding = parseFloat(getComputedStyle(content).paddingTop);
        content.closest(".cm-scroller").scrollTop = padding + index * line.getBoundingClientRect().height + 2;
    }, lineIndex);

    await expect(toggle).toBeChecked();
    const formatted = header.getByRole("button", { name: "Formatted", exact: true });
    expect((await toggle.boundingBox()).x).toBeLessThan((await formatted.boundingBox()).x);
    await scrollBeforeLine(input, 18);
    await expect.poll(() => topLine(input)).toBe(lines[18]);
    await expect.poll(() => topLine(preview)).toBe(lines[18]);
    expect(await scrollTop(preview)).toBeGreaterThan(await scrollTop(input) + 150);

    await scrollBeforeLine(input, 22);
    await expect.poll(() => topLine(preview)).toBe(lines[22]);
    await preview.evaluate((content, target) => {
        const line = [...content.querySelectorAll(".cm-line")].find((line) => line.textContent === target);
        const scroller = content.closest(".cm-scroller");
        scroller.scrollTop += line.getBoundingClientRect().top - scroller.getBoundingClientRect().top + 2;
    }, lines[25]);
    await expect.poll(() => topLine(input)).toBe(lines[25]);

    await page.getByRole("button", { name: "Diff", exact: true }).click();
    await expect(toggle).toBeDisabled();
    await page.getByRole("button", { name: "Formatted", exact: true }).click();
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeEnabled();

    // Replacing the expanding prelude removes the line offset between editors.
    const updated = lines.slice(10);
    await input.fill(updated.join("\n") + "\n");
    await expect(status).toHaveText("");
    await scrollBeforeLine(input, 12);
    await expect.poll(() => topLine(preview)).toBe(updated[12]);

    await toggle.uncheck();
    const previous = await scrollTop(preview);
    await scrollBeforeLine(input, 20);
    await expect.poll(() => topLine(input)).toBe(updated[20]);
    expect(await scrollTop(preview)).toBe(previous);
});

test("sync scroll remaps after a preview replace without another scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1450, height: 850 });
    await page.goto(siteUrl + "playground/");
    await expect(page.getByLabel("Example")).toBeEnabled();
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const header = page.locator(".playground-preview-header");
    const toggle = header.getByRole("checkbox", { name: "Sync scroll" });
    const width = page.getByLabel("Line width");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    // Compact one-line prep bodies expand when the width shrinks, so the preview
    // gains lines above the checkpoint without the user scrolling again.
    const lines = [
        ...Array.from({ length: 12 }, (_, i) =>
            `def prep${i}(): Int32 = { let first = ${i}; let second = 1; first + second }`),
        ...Array.from({ length: 40 }, (_, i) => `def checkpoint${i}(): Int32 = ${i}`),
    ];
    await input.fill(lines.join("\n") + "\n");
    await width.fill("100");
    await expect(status).toHaveText("");
    await expect(toggle).toBeChecked();
    const topLine = (editor) => editor.evaluate((content) => {
        const top = content.closest(".cm-scroller").getBoundingClientRect().top;
        return [...content.querySelectorAll(".cm-line")]
            .find((line) => line.getBoundingClientRect().bottom > top + 2)?.textContent;
    });
    const scrollBeforeLine = (editor, lineIndex) => editor.evaluate((content, index) => {
        const line = content.querySelector(".cm-line");
        const padding = parseFloat(getComputedStyle(content).paddingTop);
        content.closest(".cm-scroller").scrollTop = padding + index * line.getBoundingClientRect().height + 2;
    }, lineIndex);

    await scrollBeforeLine(input, 18);
    await expect.poll(() => topLine(input)).toBe(lines[18]);
    await expect.poll(() => topLine(preview)).toBe(lines[18]);

    await width.fill("40");
    await expect(status).toHaveText("");
    // Without resync-after-preview, the preview keeps its old scrollTop and drifts.
    await expect.poll(() => topLine(preview)).toBe(lines[18]);
    await expect.poll(() => topLine(input)).toBe(lines[18]);
});

test("sync scroll anchors keep a later declaration aligned after uneven wrapping", async ({ page }) => {
    await page.setViewportSize({ width: 1450, height: 850 });
    await page.goto(siteUrl + "playground/");
    await expect(page.getByLabel("Example")).toBeEnabled();
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const header = page.locator(".playground-preview-header");
    const toggle = header.getByRole("checkbox", { name: "Sync scroll" });
    const width = page.getByLabel("Line width");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    // Early defs expand a lot at width 40; a late one-line def must stay pinned by name.
    // Enough trailing lines so the target can sit at the top of the scrollport.
    const lines = [
        ...Array.from({ length: 12 }, (_, i) =>
            `def prep${i}(): Int32 = { let first = ${i}; let second = 1; first + second }`),
        "def target(): Int32 = 99",
        ...Array.from({ length: 40 }, (_, i) => `def after${i}(): Int32 = ${i}`),
    ];
    const target = "def target(): Int32 = 99";
    const targetIndex = lines.indexOf(target);
    await input.fill(lines.join("\n") + "\n");
    await width.fill("100");
    await expect(status).toHaveText("");
    await expect(toggle).toBeChecked();
    const topLine = (editor) => editor.evaluate((content) => {
        const top = content.closest(".cm-scroller").getBoundingClientRect().top;
        return [...content.querySelectorAll(".cm-line")]
            .find((line) => line.getBoundingClientRect().bottom > top + 2)?.textContent;
    });
    const scrollBeforeLine = (editor, lineIndex) => editor.evaluate((content, index) => {
        const line = content.querySelector(".cm-line");
        const padding = parseFloat(getComputedStyle(content).paddingTop);
        content.closest(".cm-scroller").scrollTop = padding + index * line.getBoundingClientRect().height + 2;
    }, lineIndex);

    await scrollBeforeLine(input, targetIndex);
    await expect.poll(() => topLine(input)).toBe(target);
    await expect.poll(() => topLine(preview)).toBe(target);

    await width.fill("40");
    await expect(status).toHaveText("");
    // After uneven wrapping, declaration anchors must keep the same def on both panes.
    await expect.poll(() => topLine(input)).toBe(target);
    await expect.poll(() => topLine(preview)).toBe(target);
});

test("sync scroll anchors indented module members after uneven wrapping", async ({ page }) => {
    await page.setViewportSize({ width: 1450, height: 850 });
    await page.goto(siteUrl + "playground/");
    await expect(page.getByLabel("Example")).toBeEnabled();
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const header = page.locator(".playground-preview-header");
    const toggle = header.getByRole("checkbox", { name: "Sync scroll" });
    const width = page.getByLabel("Line width");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    // Indented `pub def` must count as anchors; otherwise only `mod` pairs and Sync stays 1:1.
    const body = [
        ...Array.from({ length: 12 }, (_, i) =>
            `    pub def prep${i}(): Int32 = { let first = ${i}; let second = 1; first + second }`),
        "    pub def target(): Int32 = 99",
        ...Array.from({ length: 40 }, (_, i) => `    pub def after${i}(): Int32 = ${i}`),
    ];
    const lines = ["pub mod M {", ...body, "}"];
    const target = "    pub def target(): Int32 = 99";
    const targetIndex = lines.indexOf(target);
    await input.fill(lines.join("\n") + "\n");
    await width.fill("100");
    await expect(status).toHaveText("");
    await expect(toggle).toBeChecked();
    const topLine = (editor) => editor.evaluate((content) => {
        const top = content.closest(".cm-scroller").getBoundingClientRect().top;
        return [...content.querySelectorAll(".cm-line")]
            .find((line) => line.getBoundingClientRect().bottom > top + 2)?.textContent;
    });
    const scrollBeforeLine = (editor, lineIndex) => editor.evaluate((content, index) => {
        const line = content.querySelector(".cm-line");
        const padding = parseFloat(getComputedStyle(content).paddingTop);
        content.closest(".cm-scroller").scrollTop = padding + index * line.getBoundingClientRect().height + 2;
    }, lineIndex);

    await scrollBeforeLine(input, targetIndex);
    await expect.poll(() => topLine(input)).toBe(target);
    await expect.poll(() => topLine(preview)).toBe(target);

    await width.fill("40");
    await expect(status).toHaveText("");
    await expect.poll(() => topLine(input)).toBe(target);
    await expect.poll(() => topLine(preview)).toBe(target);
});

test("a shared repro keeps its code and original reference without fetching the source", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const raw = "https://raw.githubusercontent.com/flix/flix/fe909c20c7213088b72578a4f97f6e6f05f091ff/main/src/library/Fixpoint3/Boxable.flix";
    const blob = raw.replace("raw.githubusercontent.com", "github.com").replace("/flix/flix/", "/flix/flix/blob/");
    let requests = 0;
    await page.route(raw, (route) => {
        requests++;
        return route.abort();
    });
    await page.goto(siteUrl + "playground/");
    await expect(page.getByLabel("Example")).toBeEnabled();
    const input = page.getByRole("textbox", { name: "Flix input" });
    const repro = 'def demo(): String = "Grüße"';
    await input.fill(repro);
    await page.getByLabel("Line width").fill("60");
    await page.getByLabel("Flix version").selectOption("0.79.0");
    const open = page.locator(".playground-toolbar").getByRole("button", { name: "Load from GitHub…" });
    const dialog = page.getByRole("dialog", { name: "Load from GitHub" });
    await open.click();
    await expect(dialog.getByLabel("Source URL")).toBeFocused();
    await expect(dialog.getByRole("link", { name: "Boxable.flix permalink, lines 168–172" }))
        .toHaveAttribute("href", blob + "#L168-L172");
    await expect(dialog.getByRole("link", { name: "Boxable.flix Raw URL" })).toHaveAttribute("href", raw);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();

    await open.click();
    await dialog.getByLabel("Source URL").fill(blob + "#L168-L172");
    await dialog.getByRole("button", { name: "Attach as reference" }).click();
    await expect(dialog).toBeHidden();
    await expect(input).toHaveText(repro);
    const original = page.locator(".playground-statusbar").getByRole("link", { name: "Original · Boxable.flix:168–172" });
    await expect(original).toHaveAttribute("href", blob + "#L168-L172");
    await page.locator(".playground-toolbar").getByRole("button", { name: "Copy permalink" }).click();
    await expect(page.getByText("Permalink copied.")).toBeVisible();
    const shared = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(shared);
    await page.reload();
    await expect(input).toHaveText(repro);
    await expect(page.getByLabel("Example")).toHaveValue("");
    await expect(page.getByLabel("Line width")).toHaveValue("60");
    await expect(page.getByLabel("Flix version")).toHaveValue("0.79.0");
    await expect(original).toBeVisible();
    expect(requests).toBe(0);
});

test("a source-only link loads a complete pinned file on request and selects its original lines", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const raw = "https://raw.githubusercontent.com/flix/flix/fe909c20c7213088b72578a4f97f6e6f05f091ff/main/src/library/Fixpoint3/Boxable.flix";
    const lines = Array.from({ length: 200 }, (_, i) => `def original${i + 1}(): Int32 = ${i + 1}`);
    let requests = 0;
    const paused = Promise.withResolvers();
    await page.route(raw, async (route) => {
        requests++;
        if (requests === 1) return route.fulfill({ status: 404, body: "Not found" });
        const response = { contentType: "text/plain", body: lines.join("\n") + "\n" };
        if (requests === 2) {
            await paused.promise;
            return route.fulfill(response).catch(() => {});
        }
        return route.fulfill(response);
    });
    const params = new URLSearchParams({ sourceUrl: raw, sourceLines: "168-172", printWidth: "60" });
    await page.goto(siteUrl + "playground/#" + params);
    const input = page.getByRole("textbox", { name: "Flix input" });
    const open = page.locator(".playground-toolbar").getByRole("button", { name: "Load from GitHub…" });
    const dialog = page.getByRole("dialog", { name: "Load from GitHub" });
    const urlField = dialog.getByLabel("Source URL");
    const load = dialog.getByRole("button", { name: "Load", exact: true });
    await expect(input).toBeEmpty();
    await expect(page.getByRole("link", { name: "Original · Boxable.flix:168–172" })).toBeVisible();
    expect(requests).toBe(0);

    await open.click();
    await expect(urlField).toHaveValue(raw);
    await expect(urlField).toBeFocused();
    await urlField.fill(raw.replace(/\/[0-9a-f]{40}\//, "/main/"));
    await load.click();
    await expect(dialog.getByText("Use a GitHub file URL with a full commit SHA.")).toBeVisible();
    expect(requests).toBe(0);

    await urlField.fill(raw);
    await load.click();
    await expect(dialog.getByText("Could not load source. GitHub returned HTTP 404.")).toBeVisible();
    await expect(page.locator("[data-input] .cm-content")).toBeEmpty();

    await load.click();
    await expect.poll(() => requests).toBe(2);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    paused.resolve();
    await expect(input).toBeEmpty();

    await open.click();
    await expect(load).toBeEnabled();
    await load.click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".playground-statusbar").getByText("Source loaded.")).toBeVisible();
    await expect(page.locator("[data-cursor-position]")).toHaveText(/Ln 168, Col 1 · \d+ selected/);
    await expect(input.locator(".cm-line").filter({ hasText: lines[167] })).toBeInViewport();
    await input.press("ControlOrMeta+Home");
    await expect(input).toContainText(lines[0]);
    await input.press("ControlOrMeta+End");
    await expect(input).toContainText(lines.at(-1));

    await page.getByRole("button", { name: "Copy source link" }).click();
    await expect(page.getByText("Source link copied.")).toBeVisible();
    const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    const fragment = new URLSearchParams(shared.hash.slice(1));
    expect(fragment.has("code")).toBe(false);
    expect(fragment.get("sourceUrl")).toBe(raw);
    expect(fragment.get("sourceLines")).toBe("168-172");
    expect(fragment.get("printWidth")).toBe("60");
    expect(requests).toBe(3);

    await page.setViewportSize({ width: 390, height: 780 });
    const statusbar = page.locator(".playground-statusbar");
    await expect(statusbar.getByRole("link", { name: "Original · Boxable.flix:168–172" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("the live preview keeps trailing comments, reports cursor selection, and recovers from a syntax error", async ({ page }) => {
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const cursor = page.locator("[data-cursor-position]");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    const title = page.getByRole("heading", { level: 1, name: "Playground", exact: true });
    await expect(title).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Site" }).getByRole("heading", { level: 1 }))
        .toHaveText("Playground");
    await expect(title.getByRole("link", { name: "Playground" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Line width")).toHaveValue("100");
    await expect(page.getByLabel("Example")).toBeEnabled();
    await page.getByLabel("Example").selectOption("strings/itinerary.md");
    await expect(page.getByLabel("Line width")).toHaveValue("100");

    await input.fill("def first():Int32=1 /* first */\n\ndef second():Int32=2\n");
    await expect(preview).toContainText("def first(): Int32 = 1 /* first */");
    await expect(preview).toContainText("def second(): Int32 = 2");
    await input.press("ControlOrMeta+Home");
    await input.press("Shift+ArrowRight");
    await expect(cursor).toHaveText("Ln 1, Col 2 · 1 selected");

    // Partial recovery: damaged declaration between valid ones.
    await input.fill("def first():Int32=1 /* first */\n\ndef broken():Int32=)\n\ndef second():Int32=2\n");
    await expect(status).toContainText("Partially formatted. Error. Line 3, column 20.");
    await expect(status).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleErrorMessage(/Partially formatted/);
    await expect(input.locator(".flix-error-character")).toHaveText(")");
    await expect(preview).toContainText("def first(): Int32 = 1 /* first */");
    await expect(preview).toContainText("def broken():Int32=)");
    await expect(preview).toContainText("def second(): Int32 = 2");

    await input.fill("def first():Int32=1 /* first */\n\ndef fixed():Int32=3\n\ndef second():Int32=2\n");
    await expect(preview).toContainText("def fixed(): Int32 = 3");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(status).toBeEmpty();
});

test("partial recovery formats module siblings after a bad delimiter", async ({ page }) => {
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });

    await input.fill("mod Demo {\n    def first():Int32=1\n    def bad():Int32=(]\n    def next():Int32=2\n}\n");
    await expect(status).toContainText("Partially formatted.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(preview).toContainText("def first(): Int32 = 1");
    await expect(preview).toContainText("def bad():Int32=(]");
    await expect(preview).toContainText("def next(): Int32 = 2");
    await expect(status).not.toContainText("Not formatted.");
});

test("unrecoverable input clears a stale formatted preview", async ({ page }) => {
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });

    await input.fill("def first():Int32=1\ndef second():Int32=2\n");
    await expect(preview).toContainText("def first(): Int32 = 1");
    await expect(preview).toContainText("def second(): Int32 = 2");

    // No recovery: replace a valid program with one unrecoverable declaration.
    await input.fill("def bad():Int32=\n");
    await expect(status).toContainText("Not formatted.");
    await expect(status).not.toContainText("Partially formatted.");
    await expect(status).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(preview).toContainText("def bad():Int32=");
    await expect(preview).not.toContainText("def first()");
    await expect(preview).not.toContainText("def second()");
});

test("syntax error samples show the source unchanged and mark the input invalid", async ({ page }) => {
    await page.goto(siteUrl + "errors/");
    const fixtures = page.locator("[data-embedded-playground]");
    await expect(fixtures).not.toHaveCount(0);
    const count = await fixtures.count();
    for (let i = 0; i < count; i++) {
        const fixture = fixtures.nth(i);
        await fixture.scrollIntoViewIfNeeded();
        const input = fixture.getByRole("textbox", { name: "Flix input" });
        const preview = fixture.getByRole("textbox", { name: "Preview" });
        await expect(input).toBeVisible();
        await expect(input).toHaveAttribute("aria-invalid", "true");
        const { source, previewText } = await fixture.evaluate((root) => {
            const panes = root.querySelectorAll(".cm-content");
            return { source: panes[0]?.textContent ?? "", previewText: panes[1]?.textContent ?? "" };
        });
        expect(previewText).toBe(source);
        await expect(preview).not.toBeEmpty();
        await expect(fixture.getByRole("status", { includeHidden: true })).toContainText("Not formatted.");
    }
});

for (const override of [undefined, "54"]) {
    test(`the embedded editor hands off Unicode source with width ${override ?? "100 by default"}`, async ({ page }) => {
        await page.goto(siteUrl + "comments/#trailing-block-comment");
        const fixture = page.locator("#trailing-block-comment [data-embedded-playground]");
        const width = fixture.getByLabel("Line width");
        await expect(width).toBeVisible();
        await expect(width).toHaveValue("60");
        await expect(fixture.getByRole("checkbox", { name: "Sync scroll" })).toBeChecked();

        const embeddedInput = fixture.getByRole("textbox", { name: "Flix input" });
        await expect(embeddedInput).toHaveCSS("--playground-guide-position", /60ch/);
        const source = 'def smokeText():String="Grüße 🚉"';
        await embeddedInput.fill(source);
        if (override !== undefined) await width.fill(override);
        await fixture.getByRole("link", { name: "Open in Playground" }).click();

        await expect(page).toHaveURL(/\/playground\/\?.*#code=/);
        await expect(page.getByLabel("Example")).toBeEnabled();
        await expect(page.getByLabel("Example")).toHaveValue("");
        await expect(page.getByLabel("Line width")).toHaveValue(override ?? "100");
        const standaloneInput = page.getByRole("textbox", { name: "Flix input" });
        await expect(standaloneInput).toHaveCSS("--playground-guide-position", new RegExp(`${override ?? "100"}ch`));
        await expect(standaloneInput).toHaveText(source);
        await expect(page.getByRole("textbox", { name: "Preview" })).toContainText('def smokeText(): String = "Grüße 🚉"');
    });
}

test("a 0.79-only fixture uses its pin in the catalog and the Playground", async ({ page }) => {
    const path = "declarations/function-named-val-flix-0.79.md";
    const source = "def val():Int32=40+3";
    await page.goto(siteUrl + "playground/?fixture=" + path);
    await expect(page.getByLabel("Flix version")).toHaveValue("0.79.0");
    await expect(page.getByRole("textbox", { name: "Preview" })).toContainText("def val(): Int32 = 40 + 2");

    await page.goto(siteUrl + "declarations/#function-named-val-flix-0.79");
    const fixture = page.locator("#function-named-val-flix-0\\.79 [data-embedded-playground]");
    await expect(fixture.getByLabel("Flix version")).toHaveValue("0.79.0");
    await fixture.getByRole("textbox", { name: "Flix input" }).fill(source);
    await expect(fixture.getByRole("textbox", { name: "Preview" })).toContainText("def val(): Int32 = 40 + 3");
    await fixture.getByRole("link", { name: "Open in Playground" }).click();
    await expect(page.getByLabel("Flix version")).toHaveValue("0.79.0");
    await expect(page.getByRole("textbox", { name: "Flix input" })).toHaveText(source);
    await expect(page.getByRole("textbox", { name: "Preview" })).toContainText("def val(): Int32 = 40 + 3");
});

test("diff, copy, use formatted, invalid width and unrecoverable input stay in sync", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const width = page.getByLabel("Line width");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    const copy = page.locator(".playground-preview-header").getByRole("button", { name: "Copy", exact: true });
    const useFormatted = page.locator(".playground-input-header").getByRole("button", { name: "Use formatted" });

    await input.fill("def chosen():Int32=42");
    await expect(preview).toHaveText("def chosen(): Int32 = 42");
    await expect(useFormatted).toBeEnabled();
    await copy.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("def chosen(): Int32 = 42\n");
    await page.getByRole("button", { name: "Diff", exact: true }).click();
    const diff = page.getByRole("region", { name: "Formatting differences" });
    await expect(diff.getByText("Removed line 1:", { exact: true })).toHaveCount(1);
    await expect(diff.getByText("Added line 1:", { exact: true })).toHaveCount(1);
    // Diff mode still takes over from the preview snapshot.
    await useFormatted.click();
    await expect(input).toHaveText("def chosen(): Int32 = 42");
    await expect(status).toContainText("Input updated from formatted preview.");
    await expect(useFormatted).toBeDisabled();
    await input.focus();
    await input.press("ControlOrMeta+z");
    await expect(input).toHaveText("def chosen():Int32=42");
    await expect(useFormatted).toBeEnabled();
    await width.fill("0");
    await expect(width).toHaveAttribute("aria-invalid", "true");
    await expect(width).toHaveAccessibleErrorMessage(/whole number/);
    await expect(copy).toBeDisabled();
    await expect(useFormatted).toBeDisabled();
    await expect(diff).toHaveText("No formatted preview is available.");
    await page.getByRole("button", { name: "Formatted", exact: true }).click();
    await expect(preview).toHaveText("def chosen():Int32=42");
    await width.fill("100");
    await expect(width).not.toHaveAttribute("aria-invalid");
    await expect(preview).toHaveText("def chosen(): Int32 = 42");
    await page.getByRole("button", { name: "Diff", exact: true }).click();
    await input.fill("def");
    await expect(status).toContainText("Not formatted. Line 1, column 4. Unexpected end of input.");
    await expect(diff).toHaveText("No formatted preview is available.");
    await expect(useFormatted).toBeDisabled();
    await page.getByRole("button", { name: "Formatted", exact: true }).click();
    await expect(preview).toHaveText("def");
    await expect(copy).toBeEnabled();
    await page.locator(".playground-input-header").getByRole("button", { name: "Clear", exact: true }).click();
    await expect(input).toBeEmpty();
    await expect(status).toBeEmpty();
});

test("a timeout clears the previous preview and diff", async ({ page }) => {
    await page.addInitScript(() => {
        const Native = window.Worker;
        window.dropFormatRequests = false;
        window.Worker = class extends Native {
            postMessage(message) {
                if (!window.dropFormatRequests) super.postMessage(message);
            }
        };
    });
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
    await input.fill("def first():Int32=1");
    await expect(preview).toHaveText("def first(): Int32 = 1");
    await page.getByRole("button", { name: "Diff", exact: true }).click();
    const diff = page.getByRole("region", { name: "Formatting differences" });
    await expect(diff).toContainText("def first(): Int32 = 1");
    await page.evaluate(() => { window.dropFormatRequests = true; });
    await input.fill("def second():Int32=2");
    await expect(status).toContainText("Formatting timed out", { timeout: 12000 });
    await expect(diff).toHaveText("No formatted preview is available.");
    await page.getByRole("button", { name: "Formatted", exact: true }).click();
    await expect(preview).toHaveText("def second():Int32=2");
});

test("a line-width error clears the input diagnostic", async ({ page }) => {
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    await input.fill("def");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("Line width").fill("0");
    await expect(input).not.toHaveAttribute("aria-invalid");
});

for (const failure of ["load", "timeout"]) {
    test(`the Playground can retry after a formatter ${failure} failure`, async ({ page }) => {
        const workerAsset = /\/playground-worker\.[a-f0-9]+\.js$/;
        if (failure === "load") unavailableFormatter = true;
        else await page.route(workerAsset, (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
        const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
        try {
            await page.goto(siteUrl + "playground/");
            await expect(status).toContainText(failure === "load" ? "The formatter could not load" : "Formatting timed out", { timeout: 12000 });
        } finally {
            unavailableFormatter = false;
            if (failure === "timeout") await page.unroute(workerAsset);
        }
        await page.getByRole("textbox", { name: "Flix input" }).fill("def retry():Int32=1");
        await expect(page.getByRole("textbox", { name: "Preview" })).toHaveText("def retry(): Int32 = 1");
        await expect(status).toBeEmpty();
    });
}

test("embedded syntax examples keep separate diagnostics and previews", async ({ page }) => {
    await page.goto(siteUrl + "errors/");
    const editors = page.locator("[data-embedded-playground]");
    const first = editors.first();
    const second = editors.nth(1);
    await first.scrollIntoViewIfNeeded();
    await first.getByRole("textbox", { name: "Flix input" }).fill("def first():Int32=1");
    await second.scrollIntoViewIfNeeded();
    const bad = second.getByRole("textbox", { name: "Flix input" });
    await bad.fill("def");
    await expect(bad).toHaveAccessibleErrorMessage(/^Not formatted\. Line 1, column 4\. Unexpected end of input\./);
    await expect(first.getByRole("textbox", { name: "Preview" })).toHaveText("def first(): Int32 = 1");
    await expect(first.getByRole("textbox", { name: "Flix input" })).not.toHaveAttribute("aria-invalid");
});
