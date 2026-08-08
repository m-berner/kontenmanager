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

describe("plugins/i18n number formats", () => {
    it("defines the same number-format key set for every locale", () => {
        // Regression test: `currencyUSD` used to exist only under de-DE while
        // InfoBar.vue uses it unconditionally, and `fallbackLocale` is "en-US"
        // — so on an en-US install there was no second source and vue-i18n
        // silently formatted with default options, dropping the currency
        // style. Any future asymmetry is the same bug, so assert the shape.
        const keySets = LOCALES.map((locale) => {
            const formats = makeI18n(locale).global.numberFormats as unknown as
                Record<string, Record<string, unknown>>;
            return Object.keys(formats[locale] ?? {}).sort();
        });

        expect(keySets[0]).toEqual(keySets[1]);
    });

    it.each(LOCALES)("resolves every used number format under %s", (locale) => {
        const i18n = makeI18n(locale);
        const formats = i18n.global.numberFormats as unknown as
            Record<string, Record<string, unknown>>;
        const defined = Object.keys(formats[locale] ?? {});

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
