/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Pure locale-aware number parsing behind `CurrencyInput.vue`'s text field.
 *
 * Extracted from the SFC purely so it can be tested: a `<script setup>` block
 * is not importable (same rationale as `bookingSearch.ts`, this folder's other
 * SFC-logic extraction). `CurrencyInput.vue` has never had a test otherwise.
 */

import {round2} from "@/domain/utils/utils";

/**
 * Detects the given locale's group (thousands) and decimal separator
 * characters, so a fully formatted display value (e.g. "$1,234.56" or
 * "1.234,56 €") can be reversed back into a plain number correctly, instead
 * of assuming "," is always the decimal separator.
 */
export function getSeparators(locale: string): { group: string; decimal: string } {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    return {
        group: parts.find((p) => p.type === "group")?.value ?? ",",
        decimal: parts.find((p) => p.type === "decimal")?.value ?? "."
    };
}

/**
 * Parses a currency text-field value into a number, rounded to 2 decimals.
 *
 * A dot followed by at most 2 digits can only be a real decimal fraction, so
 * it's safe to parse directly regardless of locale. This covers the raw
 * dot-decimal editing state `CurrencyInput`'s `onFocus`/`onInput` seed (always
 * 2-decimal — see `onFocus`). A dot followed by 3+ digits is genuinely
 * ambiguous in a locale where "." is the group separator (e.g. de-DE "1.234"
 * typed/pasted as a whole-number amount, not a fraction) and must fall
 * through to the locale-aware branch below, which strips it as a group
 * separator instead of misreading it as "1.234".
 *
 * The sign is read separately from the magnitude (see the body): in a
 * symbol-prefix locale the minus and the first digit are not adjacent, so it
 * cannot be folded into the digit match.
 *
 * Both branches round to 2 decimals before returning: this used to be true
 * only by convention ("every amount in this app is rounded via round2()" —
 * asserted, not enforced). A 3+-fraction-digit amount (a typo, or a backup
 * imported with unrounded values) fell through to the locale branch, which
 * strips "." as a group separator rather than reading it as a decimal point —
 * so a value like 12.345, once round-tripped through an untouched focus/blur,
 * silently became 12345. Rounding here makes that path unreachable regardless
 * of how the value first got here.
 *
 * @param value - The raw text field value.
 * @param locale - The active `vue-i18n` locale, used to resolve separators.
 * @returns The parsed amount, rounded to 2 decimals, or 0 if unparseable.
 */
export function parseCurrency(value: string, locale: string): number {
    if (!value) return 0;
    const trimmed = value.trim();

    if (/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
        return round2(Number.parseFloat(trimmed));
    }

    const {group, decimal} = getSeparators(locale);
    // Strip group (thousands) separators first, then normalize the decimal
    // separator to ".", so locale-formatted display values like "$1,234.56"
    // or "1.234,56 €" both parse to 1234.56 instead of silently losing
    // magnitude (only the first separator was previously converted).
    const withoutGroups = group ? trimmed.split(group).join("") : trimmed;
    const withDotDecimal = decimal === "." ? withoutGroups : withoutGroups.split(decimal).join(".");
    const normalized = withDotDecimal.replace(/\s/g, "");
    // Magnitude and sign are matched SEPARATELY, not as one `-?\d+…` pattern.
    // In a locale that prefixes the currency symbol the minus and the first
    // digit are not adjacent — `n(-1234.56, "currency")` renders "-$1,234.56"
    // on en-US — so `-?` could not match at the leading "-", and the match
    // simply started at the digits and returned a POSITIVE number. Only
    // suffix-symbol locales (de-DE's "-1.234,56 €") happened to work.
    //
    // That reached well past display. `CurrencyInput`'s `wrappedRules` runs
    // this on the value Vuetify validates, which at submit time is the
    // FORMATTED string — so `oneOfTwo`'s `v < 0` rejection
    // (validationAdapter.ts) never fired on an en-US install: a negative
    // Soll/Haben amount passed validation, was stored verbatim by `formMapper`
    // (`cCredit: data.credit`), and flipped the sign of the collapsed
    // `debit - credit` tax/fee fields. `migrator.ts`'s
    // `collapseBookingCreditDebitFields` cites that same `oneOfTwo` guarantee
    // as what makes its collapse lossless.
    //
    // U+2212 MINUS SIGN is accepted alongside ASCII "-": some locales' Intl
    // output uses it, and reading it as "no sign" is the same silent error.
    const match = normalized.match(/\d+(\.\d*)?/);
    if (!match) return 0;
    const isNegative = /[-−]/.test(normalized.slice(0, match.index));
    const magnitude = Number.parseFloat(match[0]);
    return round2(isNegative ? -magnitude : magnitude);
}
