import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));

test("TypeScript consumers can import the plugin and format both Flix pins from the packed tarball", () => {
    const work = mkdtempSync(join(tmpdir(), "prettier-plugin-flix-types-"));
    try {
        const packDir = join(work, "pack");
        const consumerDir = join(work, "consumer");
        mkdirSync(packDir);
        mkdirSync(consumerDir);

        execFileSync("npm", ["pack", "--pack-destination", packDir], { cwd: root, stdio: "pipe" });
        const [tarball] = readdirSync(packDir).filter((name) => name.endsWith(".tgz"));
        assert.ok(tarball, "expected npm pack to produce a tarball");

        const prettierVersion = JSON.parse(
            execFileSync("node", ["-p", 'JSON.stringify(require("./node_modules/prettier/package.json").version)'], {
                cwd: root,
                encoding: "utf8",
            }),
        );
        const typescriptVersion = JSON.parse(
            execFileSync("node", ["-p", 'JSON.stringify(require("./node_modules/typescript/package.json").version)'], {
                cwd: root,
                encoding: "utf8",
            }),
        );

        writeFileSync(
            join(consumerDir, "package.json"),
            JSON.stringify({ name: "prettier-plugin-flix-types-consumer", private: true, type: "module" }),
        );
        writeFileSync(
            join(consumerDir, "tsconfig.json"),
            JSON.stringify({
                compilerOptions: {
                    target: "ES2022",
                    module: "NodeNext",
                    moduleResolution: "NodeNext",
                    strict: true,
                    noEmit: true,
                    skipLibCheck: true,
                },
                include: ["consumer.ts"],
            }),
        );
        writeFileSync(
            join(consumerDir, "consumer.ts"),
            [
                'import type { Plugin } from "prettier";',
                'import plugin, { defaultOptions, recoverFormatting } from "prettier-plugin-flix";',
                "",
                "const registered: Plugin = plugin;",
                "void registered;",
                "",
                "const layout = { ...defaultOptions, useTabs: false };",
                "const recovered: Promise<string | undefined> = recoverFormatting(",
                '    "def smoke(): Int32 = 1\\n",',
                "    layout,",
                "    async (source) => source,",
                ");",
                "void recovered;",
                "",
            ].join("\n"),
        );
        writeFileSync(
            join(consumerDir, "format-both.mjs"),
            [
                'import assert from "node:assert/strict";',
                'import { format } from "prettier";',
                'import plugin from "prettier-plugin-flix";',
                "",
                "const shared = \"def f(): Int32 = 1\\n\";",
                "const for79 = \"def val(): Int32 = 1\\n\";",
                "const for80 = \"val n: Int32 = 1\\n\";",
                "",
                "const out80 = await format(shared, { parser: \"flix\", plugins: [plugin], flixVersion: \"0.80.0\" });",
                "const out79 = await format(shared, { parser: \"flix\", plugins: [plugin], flixVersion: \"0.79.0\" });",
                "assert.equal(out80, \"def f(): Int32 = 1\\n\");",
                "assert.equal(out79, \"def f(): Int32 = 1\\n\");",
                "assert.equal(",
                "    await format(for80, { parser: \"flix\", plugins: [plugin], flixVersion: \"0.80.0\" }),",
                "    \"val n: Int32 = 1\\n\",",
                ");",
                "assert.equal(",
                "    await format(for79, { parser: \"flix\", plugins: [plugin], flixVersion: \"0.79.0\" }),",
                "    \"def val(): Int32 = 1\\n\",",
                ");",
                "await assert.rejects(",
                "    () => format(for80, { parser: \"flix\", plugins: [plugin], flixVersion: \"0.79.0\" }),",
                "    (err) => err instanceof SyntaxError,",
                ");",
                "",
            ].join("\n"),
        );

        execFileSync(
            "npm",
            [
                "install",
                "--no-audit",
                "--no-fund",
                `prettier@${prettierVersion}`,
                `typescript@${typescriptVersion}`,
                join(packDir, tarball),
            ],
            { cwd: consumerDir, stdio: "pipe" },
        );
        execFileSync("npx", ["tsc", "--project", "tsconfig.json"], { cwd: consumerDir, stdio: "pipe" });
        execFileSync("node", ["format-both.mjs"], { cwd: consumerDir, stdio: "pipe" });
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
});
