/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const LOCALES_DIR = path.join(SRC_DIR, "_locales");

// Add patterns for files where translations are referenced
const SOURCE_PATTERNS = ["src/**/*.{ts,tsx,js,jsx,vue}"];

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

  // t('key') or t("key") or $t('key') or $tm('key')
  const reT = /\b\$?t[m]?\(\s*(['"])([^'"\\]+)\1\s*[),]/g;
  // <i18n-t keypath="key"> in templates
  const reI18nT = /<i18n-t[^>]*\skeypath=(["'])([^"']+)\1/gi;
  // getMessage('key') or getMessage("key")
  const reGetMessage = /\bgetMessage\(\s*(['"])([^'"\\]+)\1\s*[),]/g;
  // TRANSLATION_KEYS object values: PROPERTY_NAME: "translation.key.path"
  // Matches: TRANSLATION_KEYS = { ... } or export const TRANSLATION_KEYS: Type = { ... }
  const reTranslationKeys = /TRANSLATION_KEYS\s*(?::\s*\w+)?\s*=\s*\{[^}]*\}/gs;
  const reKeyValue = /:\s*["']([^"']+)["']/g;
  // Direct string literals matching xx_* pattern (for messages.json keys)
  // Used in places like: new AppError("xx_browser_language", ...)
  const reMessageKeys = /["']xx_[a-zA-Z_]+["']/g;

  for (const re of [reT, reI18nT, reGetMessage]) {
    let m;
    while ((m = re.exec(text))) {
      const key = m[2];
      if (!key.includes("${")) {
        found.add(key);
      }
    }
  }

  // Extract keys from TRANSLATION_KEYS objects
  let match;
  while ((match = reTranslationKeys.exec(text))) {
    const objText = match[0];
    let keyMatch;
    while ((keyMatch = reKeyValue.exec(objText))) {
      const key = keyMatch[1];
      if (!key.includes("${")) {
        found.add(key);
      }
    }
  }

  // Extract xx_* message keys
  let msgMatch;
  while ((msgMatch = reMessageKeys.exec(text))) {
    const key = msgMatch[0].slice(1, -1); // Remove quotes
    found.add(key);
  }

  return found;
}

async function collectUsedKeys() {
  const files = await fg(SOURCE_PATTERNS, { dot: false, cwd: ROOT });
  const used = new Set();
  for (const f of files) {
    const text = fs.readFileSync(`${ROOT}/${f}`, "utf-8");
    const keys = extractUsedKeysFromText(text);
    keys.forEach((k) => used.add(k));
  }
  // Remove ignored
  for (const k of IGNORE_KEYS) used.delete(k);
  return used;
}

function loadLocales() {
  const localeDirs = fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  const locales = {};
  for (const dir of localeDirs) {
    const locale = dir.name; // e.g., de or en
    const guiFile = path.join(LOCALES_DIR, locale, "gui.json");
    const messagesFile = path.join(LOCALES_DIR, locale, "messages.json");

    const combined = {};

    if (fs.existsSync(guiFile)) {
      const data = readJson(guiFile);
      Object.assign(combined, flatten(data));
    }

    // Load messages.json (Chrome extension format with "message" property)
    if (fs.existsSync(messagesFile)) {
      const messagesData = readJson(messagesFile);
      // Extract keys from messages.json (the keys themselves are what's used in code)
      for (const key of Object.keys(messagesData)) {
        combined[key] = messagesData[key].message || "";
      }
    }

    locales[locale] = combined;
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
