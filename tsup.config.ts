import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: {
        index: "src/index.ts",
        react: "src/react.ts",
    },
    external: ["react", "./index"],
    outDir: "dist",
    format: ["cjs", "esm"],
    dts: true,
    minify: !options.watch,
    splitting: false,
    sourcemap: true,
    clean: true,
}));
