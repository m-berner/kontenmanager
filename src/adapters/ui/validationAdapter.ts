/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";

import {VALIDATION_CODES} from "@/domain/constants";
import type {DomainValidationResult, ValidationCodeType, ValidationRuleType} from "@/domain/types";
import {sanitizeExternalUrl} from "@/domain/utils/url";
import * as ValidationRules from "@/domain/validation/rules";

/**
 * Helper to create a Vuetify-compatible validation rule.
 *
 * @param validator - Boolean function to check validity.
 * @param message - Error message if invalid.
 * @returns A validation rule function.
 */
export function createRule(
    validator: (_value: unknown) => boolean,
    message: string
): ValidationRuleType {
    return (value) => validator(value) || message;
}

/**
 * Removes all whitespace from a string.
 *
 * @param value - The value to clean.
 * @returns Cleaned string or null if input is not a string.
 */
export function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    return value.replace(/\s/g, "");
}

/**
 * Rule that ensures only one of two fields can have a value greater than zero,
 * or that a single field is not negative. Used for Credit/Debit validation.
 *
 * @param zeroValue - The other value to check against.
 * @param message - Error message if invalid.
 * @returns A validation rule function.
 */
export function oneOfTwo(
    zeroValue: Ref<number> | number,
    message: string
): ValidationRuleType {
    return createRule((v) => {
        const tv = v as number;
        const zero = typeof zeroValue === "number" ? zeroValue : zeroValue.value;
        // Only one of the values could be 0
        if (tv > 0 && zero > 0) {
            return false;
        } else if (tv < 0) {
            return false;
        }
        return true;
    }, message);
}

/**
 * Rule that requires a value to be present (not null, empty string, or undefined).
 *
 * @param message - Error message if invalid.
 * @returns A validation rule function.
 */
export function required(message: string): ValidationRuleType {
    return createRule(
        (v) => v !== null && v !== "" && v !== undefined,
        message
    );
}

// ========================================================================
// Basic Rules
// ========================================================================

/**
 * Rule that checks the length of a string (after removing whitespace).
 *
 * @param min - Minimum length.
 * @param max - Maximum length.
 * @param message - Error message if invalid.
 * @returns A validation rule function.
 */
export function stringLength(
    min: number,
    max: number,
    message: string
): ValidationRuleType {
    return createRule((v) => {
        const cleaned = cleanString(v);
        if (!cleaned) return false;
        return cleaned.length >= min && cleaned.length <= max;
    }, message);
}

export function regex(pattern: RegExp, message: string): ValidationRuleType {
    return createRule((v) => {
        const cleaned = cleanString(v);
        if (!cleaned) return false;
        return pattern.test(cleaned);
    }, message);
}

/**
 * Shared rules for a free-form name: required, 2–32 characters, and a
 * first-character constraint.
 *
 * The first-character rule used to require an ASCII letter or one of exactly
 * six German umlauts (a-z, A-Z, ä ö ü Ä Ö Ü). Whatever it was reaching for, it
 * was not that: `ß` and
 * every accented Latin character were excluded, and so was every legitimate
 * digit start. It has two consumers, and both were bitten:
 *
 * - `StockForm`'s trading **symbol** (via `symbolRules`). Digit-leading Xetra
 *   symbols are an ordinary shape — **1COV** (Covestro), **2GB**, **3W9** — and
 *   none of them could be entered. The symbol is the field with the least
 *   reason to require an alphabetic start.
 * - `BookingTypeForm`'s booking-type **name**. These are free-form user labels,
 *   created often, with no reason to be constrained at all: **"1. Rate"**,
 *   **"2024 Gebühren"**, **"§20 Abgeltungsteuer"** were all rejected with "must
 *   begin with a letter". For a German-language finance tool this is the more
 *   likely of the two to bite in daily use.
 *
 * The rule now expresses what it was plausibly *for* — rejecting a value that
 * opens with whitespace or punctuation — as "must start with a letter or a
 * digit", using the Unicode-aware `\p{L}`/`\p{N}` classes so no alphabet is
 * privileged. Note `cleanString` already trims, so a leading-space value fails
 * this by way of its first real character rather than the space.
 */
export function nameRules(msgArray: readonly string[]): ValidationRuleType[] {
    return [
        required(msgArray[0]),
        stringLength(2, 32, msgArray[1]),
        regex(/^[\p{L}\p{N}]/u, msgArray[2])
    ];
}

/**
 * Rules for a stock's trading symbol: the same three `nameRules` checks it has
 * always had, plus an optional duplicate check.
 *
 * The duplicate rule is not optional in spirit — `stocks_uk4` is a per-account
 * UNIQUE index on `cSymbol` (migrator.ts), exactly like `uk3` is on `cISIN`.
 * Without it, a second stock sharing a symbol only failed at `store.add()`,
 * as an opaque IndexedDB ConstraintError with no field attached, while the
 * equally-unique ISIN field showed a precise inline message. Uppercased before
 * comparing, mirroring `isinRules` and matching `mapStockFormToDb`, which
 * uppercases the symbol on the way to the database.
 *
 * @param msgArray - [required, length, mustBeginWithLetter, duplicate].
 * @param isDuplicate - Predicate resolving whether the symbol is already taken.
 * @returns A validation rule array.
 */
export function symbolRules(
    msgArray: readonly string[],
    isDuplicate?: (_symbol: string) => boolean
): ValidationRuleType[] {
    const rules: ValidationRuleType[] = nameRules(msgArray);

    if (isDuplicate) {
        rules.push(createRule((v) => {
            const cleaned = cleanString(v);
            return !cleaned || !isDuplicate(cleaned.toUpperCase());
        }, msgArray[3]));
    }

    return rules;
}

/**
 * Rule requiring a real booking type id. Unlike `required()`, this also
 * rejects `-1` — the sentinel id (`BOOKING_TYPES.NONE`) of the placeholder
 * "no type" entry the booking-type select always carries — since a booking
 * must resolve to a real type for `aggregateBookingsPerType`'s strict id
 * comparison to include it in any per-type/per-year sum.
 *
 * @param msgArray - Error message if invalid.
 * @returns A validation rule array.
 */
export function bookingTypeRules(msgArray: string[]): ValidationRuleType[] {
    return [createRule((v) => typeof v === "number" && v > 0, msgArray[0])];
}

/**
 * Rule requiring a real, positive stock id. Unlike `required()`, this also
 * rejects `0` — the sentinel id of the placeholder "no stock" row every
 * account's stocks store carries — since a stock-related booking (Buy/Sell/
 * Dividend) must resolve to an actual stock for portfolio/FIFO calculations
 * to include it.
 *
 * @param msgArray - Error message if invalid.
 * @returns A validation rule array.
 */
export function stockRules(msgArray: string[]): ValidationRuleType[] {
    return [createRule((v) => typeof v === "number" && v > 0, msgArray[0])];
}

export function amountRules(
    zeroValue: Ref<number> | number,
    msgArray: string[]
): ValidationRuleType[] {
    return [oneOfTwo(zeroValue, msgArray[0])];
}

/**
 * Rule requiring a non-negative share count. Unlike the credit/debit amount
 * fields, this field had no validation at all — a negative count silently
 * inverts calculatePortfolioByStockId's Buy/Sell math and corrupts
 * calculateInvestByStockId's FIFO cost-basis walk (domain/logic.ts).
 *
 * Accepts a numeric *string* as well as a number: BookingForm.vue binds the
 * count to a Vuetify `v-text-field type="number"`, whose `onInput` assigns
 * `el.value` verbatim (no numeric cast, unlike Vue's own `vModelText` on a
 * native input — and Vue's `.number` modifier is inert because VTextField only
 * honors `modelModifiers.trim`). Vuetify then hands rules that same raw model
 * value (`useValidation`: `handler(validationModel.value)`), so a bare
 * `typeof v === "number"` check rejected every count the user actually typed —
 * validation failed, `submitGuard` returned early, and no Buy/Sell/Dividend
 * booking with a share count could be saved at all. Only an untouched `0`
 * (still a number) passed, which is why the e2e addBooking test — which never
 * fills this field — did not catch it.
 *
 * Parsed with `Number()` rather than the `toNumber()` used on the write path:
 * `toNumber` falls back to 0 for unparseable input (which would wrongly *pass*
 * this rule) and applies de/en thousands-separator heuristics that a native
 * `type="number"` control never produces.
 *
 * @param msgArray - Error message if invalid.
 * @returns A validation rule array.
 */
export function countRules(msgArray: string[]): ValidationRuleType[] {
    // Requires a count strictly greater than zero. This rule is only ever
    // applied to BookingForm's count field, which is shown solely for
    // Buy/Sell/Dividend bookings — and a stock booking of zero shares is
    // meaningless: it contributes nothing to calculatePortfolioByStockId and
    // hits the `entry.cCount === 0` skip in calculateInvestByStockId's FIFO
    // walk. The rule's own message key is `validators.countRules.required`,
    // which already promised a value was required.
    return [createRule((v) => {
        if (typeof v === "number") return Number.isFinite(v) && v > 0;
        if (typeof v !== "string") return false;
        const trimmed = v.trim();
        // Number("") is 0, so the empty/cleared field must be rejected first.
        if (trimmed === "") return false;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) && parsed > 0;
    }, msgArray[0])];
}

export function validateIBAN(iban: string): boolean {
    return ValidationRules.validateIBAN(iban).isValid;
}

export function isoDateRules(msgArray: string[]): ValidationRuleType[] {
    const isValid = (message: string): ValidationRuleType => {
        return createRule((v) => {
            const tv = v as string;
            const date = new Date(`${tv}T00:00:00Z`);
            return !isNaN(date.getTime());
        }, message);
    };
    return [
        regex(/^\d{4}-\d{2}-\d{2}$/, msgArray[0]),
        isValid(msgArray[1])
    ];
}

export function ibanRules(
    msgArray: readonly string[],
    isDuplicate?: (_iban: string) => boolean
): ValidationRuleType[] {
    const rules: ValidationRuleType[] = [
        required(msgArray[0]),
        fromDomain((v) => ValidationRules.validateIBAN(v as string), {
            [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
            [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
            // Same slot order as isinRules. Added when validateIBAN stopped
            // folding "country not in IBAN_LENGTH_CODES" into INVALID_LENGTH.
            [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[3],
            [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[4],
            [VALIDATION_CODES.REQUIRED]: msgArray[0]
        })
    ];

    if (isDuplicate) {
        rules.push(createRule((v) => {
            const cleaned = cleanString(v);
            return !cleaned || !isDuplicate(cleaned.toUpperCase());
        }, msgArray[5]));
    }

    return rules;
}

export function validateISIN(isin: string): boolean {
    return ValidationRules.validateISIN(isin).isValid;
}

export function isinRules(
    msgArray: readonly string[],
    isDuplicate?: (_isin: string) => boolean
): ValidationRuleType[] {
    const rules: ValidationRuleType[] = [
        required(msgArray[0]),
        fromDomain((v) => ValidationRules.validateISIN(v as string), {
            [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
            [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
            [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[3],
            [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[4],
            [VALIDATION_CODES.REQUIRED]: msgArray[0]
        })
    ];

    if (isDuplicate) {
        rules.push(createRule((v) => {
            const cleaned = cleanString(v);
            return !cleaned || !isDuplicate(cleaned.toUpperCase());
        }, msgArray[5]));
    }

    return rules;
}

/**
 * Rules for an account's BIC/SWIFT field.
 *
 * The map holds exactly the codes `validateSWIFT` can return. It used to carry
 * five more (bank, country, region, branch, test-BIC), each with its own
 * translated message and none of them reachable — see the note in
 * `domain/validation/rules.ts`. Keep this map and that function in step: an
 * entry here for a code the validator cannot produce is a message the user is
 * promised and never shown.
 */
export function swiftRules(msgArray: readonly string[]): ValidationRuleType[] {
    return [
        required(msgArray[0]),
        fromDomain((v) => ValidationRules.validateSWIFT(v as string), {
            [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
            [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
            [VALIDATION_CODES.REQUIRED]: msgArray[0]
        })
    ];
}

/**
 * Rules for an optional external link (a stock's `cURL`).
 *
 * The URL field was the only one in `StockForm` with no `:rules` binding at
 * all, and `validationAdapter` had no URL rule to bind even if one had been
 * wanted — so `javascript:`, `data:` and `file:` values were accepted at entry,
 * persisted, and later handed to `window.open`. This rejects at the boundary
 * what `sanitizeExternalUrl` rejects at the sink, so the user finds out while
 * typing rather than by the link silently not opening.
 *
 * Blank passes: the link is optional, and `required` is not part of this set.
 *
 * @param message - Shown when the value is present but not a usable http(s) URL.
 */
export function urlRules(message: string): ValidationRuleType[] {
    return [
        createRule((v) => {
            const cleaned = cleanString(v);
            return !cleaned || sanitizeExternalUrl(cleaned) !== null;
        }, message)
    ];
}

/**
 * Map a domain DomainValidationResult to a Vuetify rule.
 */
function fromDomain(
    domainFn: (_v: string) => DomainValidationResult,
    messageMap: Partial<Record<ValidationCodeType, string>>
): ValidationRuleType {
    return (v: unknown) => {
        const normalized = cleanString(v) ?? "";
        const res = domainFn(normalized);
        if (res.isValid) return true;
        return res.error ? messageMap[res.error] || "Invalid" : "Invalid";
    };
}

export function createValidationAdapter() {
    return {
        createRule,
        cleanString,
        oneOfTwo,
        required,
        stringLength,
        regex,
        nameRules,
        symbolRules,
        bookingTypeRules,
        stockRules,
        amountRules,
        countRules,
        validateIBAN,
        isoDateRules,
        ibanRules,
        validateISIN,
        isinRules,
        swiftRules,
        urlRules
    };
}

export type ValidationAdapter = ReturnType<typeof createValidationAdapter>;
