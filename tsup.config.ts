import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    minify: !options.watch,
    splitting: false,
    sourcemap: true,
    clean: true,
}));
