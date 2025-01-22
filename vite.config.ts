import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 5001,
  },
  resolve: {
    alias: {
      "micetrap/": resolve(__dirname),
      "micetrap/react": resolve(__dirname, "dist/react.mjs"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "example/index.html"),
      },
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
