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
    // root is "./src" below, but .env files live at the project root — without this, Vite's
    // client-side import.meta.env injection looks in src/ and silently misses them.
    envDir: fileURLToPath(new URL(".", import.meta.url)),
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

  // Shared by both development and production builds. Production additionally zips a release
  // .xpi (see prodConfig below) — everything else about the build is identical, so keep it in
  // one place rather than two configs that have to be edited in lockstep.
  const appConfig = {
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
      // WebExtension CSP disallows inlined data: URIs for assets — keep every asset its own file.
      assetsInlineLimit: 0,
      emptyOutDir: true,
      outDir: `../${BUILD_DIR}`,
      // The module-preload polyfill is for assets fetched over a network; irrelevant (and unwanted)
      // for an extension loaded from local disk.
      modulePreload: false,
      css: { devSourcemap: false },
      // vendor.js is intentionally one large, unminified chunk (see manualChunks below) — raise the
      // default 500kB budget so that choice doesn't trip Rollup's warning on every build.
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: {
          background: "src/adapters/ui/entrypoints/background.html",
          app: "src/adapters/ui/entrypoints/app.html",
          options: "src/adapters/ui/entrypoints/options.html"
        },
        output: {
          // Give the shared vendor runtime a stable, honest name. Without this, rollup's automatic
          // chunk-splitting names the chunk after whichever module it happens to land on (it used
          // to end up as "router.js", even though most of its contents were unrelated Vue/Vuetify
          // runtime code). "router.js" can silently shift on unrelated changes elsewhere.
          manualChunks(id) {
            if (id.includes("node_modules")) return "vendor";
          },
          entryFileNames: "adapters/ui/entrypoints/[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "adapters/ui/assets/[name].[ext]",
          format: "es"
        }
      }
    }
  };

  const prodConfig = {
    ...appConfig,
    plugins: [
      ...appConfig.plugins,
      zipPack({
        inDir: `./${BUILD_DIR}`,
        outDir: `${RELEASE_DIR}`,
        outFileName: `${RELEASE_XPI}`
      })
    ]
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

  if (mode === "development") {
    return { ...baseConfig, ...appConfig };
  } else if (mode === "test") {
    return { ...baseConfig, ...testConfig };
  } else {
    return { ...baseConfig, ...prodConfig };
  }
});
