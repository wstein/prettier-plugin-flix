let formatter;

self.addEventListener("message", async ({ data }) => {
    const { id, source, options, asset } = data;
    let formatFlixPreview;
    try {
        formatter ??= import(new URL(asset, self.location.href));
        const module = await formatter;
        await module.loadFormatterGrammar(options);
        formatFlixPreview = module.formatFlixPreview;
    } catch {
        self.postMessage({ id, failure: "load" });
        return;
    }
    try {
        self.postMessage({ id, ...await formatFlixPreview(source, options) });
    } catch (error) {
        self.postMessage({ id, error: { message: error.message, location: error.loc?.start } });
    }
});
