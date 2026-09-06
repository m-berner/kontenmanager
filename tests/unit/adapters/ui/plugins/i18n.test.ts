/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";

import {createI18nPlugin} from "@/adapters/ui/plugins/i18n";

const LOCALES = ["de-DE", "en-US"] as const;

/** Number-format keys actually referenced from templates (`n(value, "<key>")`). */
const USED_NUMBER_FORMATS = [
    "currency",
    "currency3",
    "currencyUSD",
    "decimal3",
    "integer",
    "percent"
] as const;

function makeI18n(locale: (typeof LOCALES)[number]) {
    return createI18nPlugin({getUserLocale: () => locale});
}

/**
 * Reads the configured number formats out of the global i18n instance.
 *
 * `.value` is load-bearing: the plugin runs in **composition** mode, where
 * `i18n.global` is a Composer and `numberFormats` is a `ComputedRef`, not the
 * plain object Legacy mode's `VueI18n` getter used to expose. Without it every
 * lookup below silently reads `undefined` and each assertion passes against an
 * empty key set rather than against the formats — which is exactly what the two
 * `toContain` assertions caught when the mode was switched, and what the
 * key-set-equality assertion above them did *not*, having compared `[]` to `[]`.
 */
function numberFormatsOf(i18n: ReturnType<typeof makeI18n>, locale: string): string[] {
    const formats = i18n.global.numberFormats.value as unknown as
        Record<string, Record<string, unknown>>;
    return Object.keys(formats[locale] ?? {});
}

describe("plugins/i18n number formats", () => {
    it("resolves the number formats at all (guards the two assertions below)", () => {
        // A standalone non-emptiness check, because both assertions below are
        // satisfied by an empty key set. See `numberFormatsOf`.
        for (const locale of LOCALES) {
            expect(numberFormatsOf(makeI18n(locale), locale).length).toBeGreaterThan(0);
        }
    });

    it("runs in composition mode", () => {
        // Legacy mode is deprecated in vue-i18n v11 and removed in v12, and the
        // app ran on it purely by omission. It also decides the shape of
        // `i18n.global`: a Composer's `locale` is a WritableComputedRef, so
        // `createI18nPlugin`'s `.locale.value = ...` is only correct here.
        expect(makeI18n("de-DE").mode).toBe("composition");
    });

    it("applies the locale reported by the browser adapter", () => {
        // The bare `i18n.global.locale = ...` that Legacy mode accepted would,
        // in composition mode, replace the ref with a string and leave the
        // locale silently at the configured "en-US" default.
        expect(makeI18n("de-DE").global.locale.value).toBe("de-DE");
    });

    it("defines the same number-format key set for every locale", () => {
        // Regression test: `currencyUSD` used to exist only under de-DE while
        // InfoBar.vue uses it unconditionally, and `fallbackLocale` is "en-US"
        // — so on an en-US install there was no second source and vue-i18n
        // silently formatted with default options, dropping the currency
        // style. Any future asymmetry is the same bug, so assert the shape.
        const keySets = LOCALES.map((locale) =>
            numberFormatsOf(makeI18n(locale), locale).sort()
        );

        expect(keySets[0]).toEqual(keySets[1]);
    });

    it.each(LOCALES)("resolves every used number format under %s", (locale) => {
        const defined = numberFormatsOf(makeI18n(locale), locale);

        for (const key of USED_NUMBER_FORMATS) {
            expect(defined).toContain(key);
        }
    });

    it.each(LOCALES)("formats currencyUSD as US dollars under %s", (locale) => {
        // The point of a separate `currencyUSD` key: commodity prices are
        // quoted in USD regardless of the user's locale, unlike `currency`,
        // which follows it. Both locales must therefore render USD here.
        const formatted = makeI18n(locale).global.n(1234.56, "currencyUSD");
        expect(formatted).toMatch(/\$|USD/);
    });

    it("keeps `currency` locale-dependent", () => {
        expect(makeI18n("de-DE").global.n(1234.56, "currency")).toMatch(/€|EUR/);
        expect(makeI18n("en-US").global.n(1234.56, "currency")).toMatch(/\$|USD/);
    });
});
