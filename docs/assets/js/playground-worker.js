let formatter;

self.addEventListener("message", async ({ data }) => {
    const { id, source, options, asset } = data;
    try {
        formatter ??= import(new URL(asset, self.location.href));
        const { formatFlixPreview } = await formatter;
        self.postMessage({ id, ...await formatFlixPreview(source, options) });
    } catch (error) {
        self.postMessage({ id, error: { message: error.message, location: error.loc?.start } });
    }
});
