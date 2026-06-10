/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "url";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { viteStaticCopy } from "vite-plugin-static-copy";
import zipPack from "vite-plugin-zip-pack";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const {
    BUILD_DIR = "build",
    EXTENSIONS_DIR = "extension",
    RELEASE_DIR = "extension",
    RELEASE_XPI = "kontenmanager@gmx.de.xpi"
  } = env;

  // Base configs shared across all modes (including test)
  const baseConfig = {
    resolve: {
      alias: [
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url))
        },
        {
          find: "@test",
          replacement: fileURLToPath(new URL("./tests/unit/support", import.meta.url))
        }
      ]
    }
  };

  const prodConfig = {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      viteStaticCopy({
        targets: [
          { src: "../manifest.json", dest: BUILD_DIR, overwrite: true },
          { src: "adapters/ui/assets/icon16.png", dest: ".", overwrite: true },
          { src: "adapters/ui/_locales/de/gui.json", dest: ".", rename: "../../../../_locales/de/gui.json", overwrite: true },
          { src: "adapters/ui/_locales/de/messages.json", dest: ".", rename: "../../../../_locales/de/messages.json", overwrite: true },
          { src: "adapters/ui/_locales/en/gui.json", dest: ".", rename: "../../../../_locales/en/gui.json", overwrite: true },
          { src: "adapters/ui/_locales/en/messages.json", dest: ".", rename: "../../../../_locales/en/messages.json", overwrite: true },
          EXTENSIONS_DIR && { src: `../${BUILD_DIR}`, dest: EXTENSIONS_DIR, overwrite: true }
        ].filter(Boolean)
      }),
      zipPack({
        inDir: `./${BUILD_DIR}`,
        outDir: `${RELEASE_DIR}`,
        outFileName: `${RELEASE_XPI}`
      })
    ].filter(Boolean),
    assetsInclude: ["**/*.svg", "**/*.png"],
    root: "./src",
    base: "./",
    build: {
      minify: false,
      sourcemap: false,
      cssMinify: false,
      cssCodeSplit: true,
      target: ["es2022", "firefox140"],
      assetsDir: "adapters/ui/assets",
      assetsInlineLimit: 0,
      emptyOutDir: false,
      outDir: `../${BUILD_DIR}`,
      modulePreload: false,
      css: { devSourcemap: false },
      rollupOptions: {
        input: {
          background: "src/adapters/ui/entrypoints/background.html",
          app: "src/adapters/ui/entrypoints/app.html",
          options: "src/adapters/ui/entrypoints/options.html"
        },
        output: {
          entryFileNames: "adapters/ui/entrypoints/[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "adapters/ui/assets/[name].[ext]",
          format: "es"
        }
      }
    }
  };

  const testConfig = {
    cacheDir: "../node_modules/.vite",
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["vitest-setup.js"],
      include: [
        "tests/unit/**/*.test.ts",
        "tests/unit/**/*.spec.ts"
      ]
    }
  };

  const devConfig = {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      viteStaticCopy({
        targets: [
          { src: "../manifest.json", dest: BUILD_DIR, overwrite: true },
          { src: "adapters/ui/assets/icon16.png", dest: ".", overwrite: true },
          { src: "adapters/ui/_locales/de/gui.json", dest: ".", rename: "../../../../_locales/de/gui.json", overwrite: true },
          { src: "adapters/ui/_locales/de/messages.json", dest: ".", rename: "../../../../_locales/de/messages.json", overwrite: true },
          { src: "adapters/ui/_locales/en/gui.json", dest: ".", rename: "../../../../_locales/en/gui.json", overwrite: true },
          { src: "adapters/ui/_locales/en/messages.json", dest: ".", rename: "../../../../_locales/en/messages.json", overwrite: true },
          EXTENSIONS_DIR && { src: `../${BUILD_DIR}`, dest: EXTENSIONS_DIR, overwrite: true }
        ].filter(Boolean)
      })
    ].filter(Boolean),
    assetsInclude: ["**/*.svg", "**/*.png"],
    root: "./src",
    base: "./",
    build: {
      minify: false,
      sourcemap: false, // if enabled, one has to change outDir too
      cssMinify: false,
      cssCodeSplit: true,
      target: ["es2022", "firefox140"],
      assetsDir: "adapters/ui/assets",
      assetsInlineLimit: 0,
      emptyOutDir: false,
      outDir: `../${BUILD_DIR}`,
      modulePreload: false,
      css: { devSourcemap: false },
      rollupOptions: {
        input: {
          background: "src/adapters/ui/entrypoints/background.html",
          app: "src/adapters/ui/entrypoints/app.html",
          options: "src/adapters/ui/entrypoints/options.html"
        },
        output: {
          entryFileNames: "entrypoints/[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "adapters/ui/assets/[name].[ext]",
          format: "es"
        }
      }
    }
  };

  if (mode === "development") {
    return { ...baseConfig, ...devConfig };
  } else if (mode === "test") {
    return { ...baseConfig, ...testConfig };
  } else {
    return { ...baseConfig, ...prodConfig };
  }
});
