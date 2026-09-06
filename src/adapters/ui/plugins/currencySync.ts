/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Pinia} from "pinia";
import {effectScope, watch} from "vue";

import {resolveDisplayCurrency} from "@/domain/logic";
import {log} from "@/domain/utils/utils";

import type {I18nPlugin} from "@/adapters/ui/plugins/i18n";
import {useAccountsStore} from "@/adapters/ui/stores/accounts";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

/**
 * Keeps the `currency` / `currency3` number formats pointed at the currency the
 * figures on screen are actually in.
 *
 * **Why this exists at all.** `plugins/i18n.ts` declares those two formats once
 * per locale, with EUR baked into the `de-DE` block and USD into `en-US`. That
 * made the rendered currency a function of the UI language: an English-language
 * browser printed `$` on euro amounts, and — worse — the same locale-derived
 * currency was used as the *conversion target*, so the numbers were rescaled to
 * match the wrong label. Currency is now an explicit property of the account,
 * and this is what carries that decision through to the formatter.
 *
 * The locale still owns everything a locale should own. `Intl.NumberFormat`
 * takes the locale and the currency as independent inputs, so `en-US` + EUR
 * renders `€1,234.56` while `de-DE` + EUR renders `1.234,56 €` — same amount,
 * same currency, each formatted the way that user expects to read numbers.
 *
 * **Why it patches formats rather than changing the call sites.** Thirteen
 * templates call `n(value, "currency")`. Rewriting each to pass an inline
 * `{style, currency}` would work, but it would put the currency decision in
 * thirteen places and guarantee that a fourteenth call site is added without
 * it. `mergeNumberFormat` keeps the decision here, and every existing call site
 * correct by construction.
 *
 * `currencyUSD` is deliberately left alone: it means "format as USD" regardless
 * of anything else, because commodity prices are quoted in USD (see the note in
 * `plugins/i18n.ts`). It is not a display-currency question.
 *
 * Runs in its own effect scope so entrypoints can start it without a component,
 * exactly like `startThemeSync`.
 *
 * @param pinia - The app's Pinia instance; passed explicitly because this runs
 *   outside `setup()`.
 * @param i18n - The i18n plugin whose formats are patched.
 * @returns A stop function that disposes the watcher.
 */
export function startCurrencySync(pinia: Pinia, i18n: I18nPlugin): () => void {
    const scope = effectScope(true);

    scope.run(() => {
        const settings = useSettingsStore(pinia);
        const accounts = useAccountsStore(pinia);

        watch(
            () => resolveDisplayCurrency(
                accounts.items,
                settings.activeAccountId,
                settings.currency
            ),
            (currency) => {
                // Patched for EVERY configured locale, not just the active one.
                // `getUserLocale()` fixes the locale for the session today, but
                // `fallbackLocale` is "en-US", so a lookup can still resolve
                // through the other block — and leaving that one on its old
                // hardcoded currency is precisely the kind of half-applied
                // setting that shows up as one stray `$` in an otherwise
                // euro-denominated view.
                for (const locale of ["de-DE", "en-US"] as const) {
                    i18n.global.mergeNumberFormat(locale, {
                        currency: {style: "currency", currency, notation: "standard"},
                        currency3: {
                            style: "currency",
                            currency,
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                            notation: "standard"
                        }
                    });
                }
                log("PLUGINS currencySync: display currency", currency, "info");
            },
            {immediate: true}
        );
    });

    log("PLUGINS currencySync");
    return () => scope.stop();
}
