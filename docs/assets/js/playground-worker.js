let formatter;

self.addEventListener("message", async ({ data }) => {
    const { id, source, options, asset } = data;
    try {
        formatter ??= import(new URL(asset, self.location.href));
        const { formatFlix } = await formatter;
        self.postMessage({ id, output: await formatFlix(source, options) });
    } catch (error) {
        self.postMessage({ id, error: { message: error.message, location: error.loc?.start } });
    }
});
