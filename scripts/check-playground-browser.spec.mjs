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
    ".wasm": "application/wasm",
};

let server;
let siteUrl;

// Keep the same base path as GitHub Pages so fixture URLs and worker imports
// exercise the files that will actually be deployed.
test.beforeAll(async () => {
    await readFile(resolve(siteRoot, "playground/index.html"));
    server = createServer(async (request, response) => {
        try {
            const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
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

test("inline search finds both documentation pages and still finds fixtures", async ({ page }) => {
    await page.goto(siteUrl);
    const search = page.getByRole("search", { name: "Catalog" });
    const input = search.getByRole("searchbox");
    const results = search.locator(".site-search-dropdown");

    await input.fill("formatting style");
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
    const guide = chapters.getByRole("list", { name: "Guide" });
    await expect(guide.getByRole("link")).toHaveText(["Formatting style", "Before and after"]);
    await expect(guide.getByRole("link", { name: "Before and after" })).toHaveAttribute("aria-current", "page");
    await expect(chapters.getByRole("list", { name: "Language fixtures" }).getByRole("link"))
        .toHaveText(["Datalog", "Declarations", "Expressions", "Strings"]);
    await expect(chapters.getByRole("list", { name: "Formatter behavior" }).getByRole("link"))
        .toHaveText(["Comments", "Options", "Syntax errors", "Whitespace-sensitive syntax"]);
    await expect(fixture.getByRole("textbox", { name: "Flix input" })).toBeVisible();
    expect((await siteLink.boundingBox()).x).toBeCloseTo((await chapters.boundingBox()).x, 0);
    expect((await input.boundingBox()).y).toBeCloseTo((await preview.boundingBox()).y, 0);

    for (const width of [1120, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(guide.getByRole("link", { name: "Formatting style" })).toBeVisible();
        expect((await preview.boundingBox()).y).toBeGreaterThan((await input.boundingBox()).y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
});

test("the live preview keeps trailing comments, reports cursor selection, and recovers from a syntax error", async ({ page }) => {
    await page.goto(siteUrl + "playground/");
    const input = page.getByRole("textbox", { name: "Flix input" });
    const preview = page.getByRole("textbox", { name: "Preview" });
    const cursor = page.locator("[data-cursor-position]");
    const status = page.locator("[data-full-playground]").getByRole("status", { includeHidden: true });
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

    await input.fill("def first():Int32=1 /* first */\n\ndef broken():Int32=)\n\ndef second():Int32=2\n");
    await expect(status).toContainText("Partially formatted. Error. Line 3, column 20.");
    await expect(status).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input.locator(".flix-error-character")).toHaveText(")");
    await expect(preview).toContainText("def first(): Int32 = 1 /* first */");
    await expect(preview).toContainText("def broken():Int32=)");
    await expect(preview).toContainText("def second(): Int32 = 2");

    await input.fill("def first():Int32=1 /* first */\n\ndef fixed():Int32=3\n\ndef second():Int32=2\n");
    await expect(preview).toContainText("def fixed(): Int32 = 3");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(status).toBeEmpty();
});

for (const override of [undefined, "54"]) {
    test(`the embedded editor hands off Unicode source with width ${override ?? "100 by default"}`, async ({ page }) => {
        await page.goto(siteUrl + "comments/#trailing-block-comment");
        const fixture = page.locator("#trailing-block-comment [data-embedded-playground]");
        const width = fixture.getByLabel("Line width");
        await expect(width).toBeVisible();
        await expect(width).toHaveValue("60");

        const source = 'def smokeText():String="Grüße 🚉"';
        await fixture.getByRole("textbox", { name: "Flix input" }).fill(source);
        if (override !== undefined) await width.fill(override);
        await fixture.getByRole("link", { name: "Open in Playground" }).click();

        await expect(page).toHaveURL(/\/playground\/\?/);
        await expect(page.getByLabel("Example")).toBeEnabled();
        await expect(page.getByLabel("Example")).toHaveValue("");
        await expect(page.getByLabel("Line width")).toHaveValue(override ?? "100");
        await expect(page.getByRole("textbox", { name: "Flix input" })).toHaveText(source);
        await expect(page.getByRole("textbox", { name: "Preview" })).toContainText('def smokeText(): String = "Grüße 🚉"');
    });
}
