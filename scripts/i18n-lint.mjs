/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "../src");
const LOCALES_DIR = path.join(SRC_DIR, "_locales");

// Add patterns for files where translations are referenced
const SOURCE_PATTERNS = ["../src/**/*.{ts,tsx,js,jsx,vue}"];

// Ignore dynamic/computed keys that the tool can’t resolve reliably
const IGNORE_KEYS = new Set([
  // "components.dialogs.importDatabase.messages.importSuccess"
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

// Extract keys used in code/templates
function extractUsedKeysFromText(text) {
  const found = new Set();

  // t('key') or t("key")
  const reT = /\b\$?t\(\s*(['"])([^'"\\]+)\1\s*[),]/g;
  // <i18n-t keypath="key"> in templates
  const reI18nT = /<i18n-t[^>]*\skeypath=(["'])([^"']+)\1/gi;

  for (const re of [reT, reI18nT]) {
    let m;
    while ((m = re.exec(text))) {
      const key = m[2];
      if (!key.includes("${")) {
        found.add(key);
      }
    }
  }

  return found;
}

async function collectUsedKeys() {
  const files = await fg(SOURCE_PATTERNS, { dot: false });
  const used = new Set();
  for (const f of files) {
    const text = fs.readFileSync(f, "utf-8");
    const keys = extractUsedKeysFromText(text);
    keys.forEach((k) => used.add(k));
  }
  // Remove ignored
  for (const k of IGNORE_KEYS) used.delete(k);
  return used;
}

function loadLocales() {
  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
  const locales = {};
  for (const f of files) {
    const locale = path.basename(f, ".json"); // e.g., de-DE
    const data = readJson(path.join(LOCALES_DIR, f));
    locales[locale] = flatten(data);
  }
  return locales;
}

function main() {
  const locales = loadLocales();
  const localeNames = Object.keys(locales);
  if (localeNames.length === 0) {
    console.error("No locale files found in", LOCALES_DIR);
    process.exit(1);
  }

  collectUsedKeys()
    .then((usedKeys) => {
      // Missing keys: used in code but not present in any locale or at least one locale
      const missingByLocale = {};
      for (const locale of localeNames) missingByLocale[locale] = [];

      for (const key of usedKeys) {
        for (const locale of localeNames) {
          if (!(key in locales[locale])) {
            missingByLocale[locale].push(key);
          }
        }
      }

      // Unused keys: present in locales but never used
      const unusedByLocale = {};
      for (const locale of localeNames) {
        const allKeys = Object.keys(locales[locale]);
        unusedByLocale[locale] = allKeys.filter((k) => !usedKeys.has(k));
      }

      let exitCode = 0;

      // Report
      for (const locale of localeNames) {
        const miss = missingByLocale[locale];
        const unused = unusedByLocale[locale];

        if (miss.length) {
          exitCode = 1;
          console.error(`\n[${locale}] Missing keys (${miss.length}):`);
          miss.sort().forEach((k) => console.error("  -", k));
        }

        // Unused are non-fatal by default; make fatal via a flag if you want
        if (unused.length) {
          console.log(`\n[${locale}] Unused keys (${unused.length}):`);
          unused.sort().forEach((k) => console.log("  -", k));
        }
      }

      if (exitCode !== 0) {
        console.error("\n✖ i18n issues found.");
      } else {
        console.log("\n✔ i18n check passed.");
      }
      process.exit(exitCode);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

main();
