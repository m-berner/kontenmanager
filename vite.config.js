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
  const { BUILD_DIR, EXTENSIONS_DIR, RELEASE_DIR, RELEASE_XPI  } = env;

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
          { src: "../manifest.json", dest: "./", overwrite: true },
          { src: "adapters/primary/assets/icon16.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/icon48.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/icon64.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/connection48.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/_locales/", dest: "./", overwrite: true },
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
      assetsDir: "assets",
      assetsInlineLimit: 0,
      emptyOutDir: false,
      outDir: `../${BUILD_DIR}`,
      modulePreload: false,
      css: { devSourcemap: false },
      rollupOptions: {
        input: {
          background: "src/adapters/primary/entrypoints/background.html",
          app: "src/adapters/primary/entrypoints/app.html",
          options: "src/adapters/primary/entrypoints/options.html"
        },
        output: {
          entryFileNames: "entrypoints/[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "assets/[name].[ext]",
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
          { src: "../manifest.json", dest: "./", overwrite: true },
          { src: "adapters/primary/assets/icon16.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/icon48.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/icon64.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/assets/connection48.png", dest: "assets/", overwrite: true },
          { src: "adapters/primary/_locales/", dest: "./", overwrite: true },
          EXTENSIONS_DIR && { src: `../${BUILD_DIR}`, dest: EXTENSIONS_DIR, overwrite: true }
        ].filter(Boolean)
      })
    ].filter(Boolean),
    assetsInclude: ["**/*.svg", "**/*.png"],
    root: "./src",
    base: "./",
    build: {
      minify: false,
      sourcemap: false, // if enabled, one has to change outDir as well
      cssMinify: false,
      cssCodeSplit: true,
      target: ["es2022", "firefox140"],
      assetsDir: "assets",
      assetsInlineLimit: 0,
      emptyOutDir: false,
      outDir: `../${BUILD_DIR}`,
      modulePreload: false,
      css: { devSourcemap: false },
      rollupOptions: {
        input: {
          background: "src/adapters/primary/entrypoints/background.html",
          app: "src/adapters/primary/entrypoints/app.html",
          options: "src/adapters/primary/entrypoints/options.html"
        },
        output: {
          entryFileNames: "entrypoints/[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "assets/[name].[ext]",
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
