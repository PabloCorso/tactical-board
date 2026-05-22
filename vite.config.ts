/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const libraryExternalPackages = [
  "@base-ui/react",
  "@phosphor-icons/react",
  "base-ui",
  "class-variance-authority",
  "clsx",
  "react",
  "react-dom",
  "tailwind-merge",
  "use-sync-external-store",
  "zustand",
];

function isLibraryExternal(id: string) {
  return libraryExternalPackages.some(
    (packageName) => id === packageName || id.startsWith(`${packageName}/`),
  );
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [tailwindcss(), react()],
  publicDir: false,
  build: {
    lib: {
      entry: {
        "tactical-board": path.resolve(dirname, "src/index.ts"),
        react: path.resolve(dirname, "src/react/index.ts"),
      },
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
      name: "TacticalBoard",
    },
    rollupOptions: {
      external: isLibraryExternal,
    },
  },
  resolve: {
    alias: {
      "#app": path.resolve(dirname, "src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
