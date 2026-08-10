/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {VALID_COUNTRY_CODES, VALIDATION_CODES} from "@/domain/constants";
import type {DomainValidationResult} from "@/domain/types";

/** Expected total character length of an IBAN per ISO 13616 country code. */
const IBAN_LENGTH_CODES = {
    AD: 24,
    AE: 23,
    AL: 28,
    AT: 20,
    AZ: 28,
    BA: 20,
    BE: 16,
    BG: 22,
    BH: 22,
    BR: 29,
    BY: 28,
    CH: 21,
    CR: 22,
    CY: 28,
    CZ: 24,
    DE: 22,
    DK: 18,
    DO: 28,
    EE: 20,
    EG: 29,
    ES: 24,
    FI: 18,
    FO: 18,
    FR: 27,
    GB: 22,
    GE: 22,
    GI: 23,
    GL: 18,
    GR: 27,
    GT: 28,
    HR: 21,
    HU: 28,
    IE: 22,
    IL: 23,
    IS: 26,
    IT: 27,
    JO: 30,
    KW: 30,
    KZ: 20,
    LB: 28,
    LC: 32,
    LI: 21,
    LT: 20,
    LU: 20,
    LV: 21,
    MC: 27,
    MD: 24,
    ME: 22,
    MK: 19,
    MR: 27,
    MT: 31,
    MU: 30,
    NL: 18,
    NO: 15,
    PK: 24,
    PL: 28,
    PS: 29,
    PT: 25,
    QA: 29,
    RO: 24,
    RS: 22,
    SA: 24,
    SE: 24,
    SI: 19,
    SK: 24,
    SM: 27,
    TN: 24,
    TR: 26,
    UA: 29,
    VG: 24,
    XK: 20
} as const;

/** Numeric constants shared across IBAN and ISIN validation algorithms. */
const RULE_CODES = {
    CHAR_CODE_OFFSET: 55,
    MOD_97: 97n,
    LUHN_BASE: 10
} as const;

// A `required(value)` domain validator used to live here. It was removed: the
// only two importers of this module take `validateIBAN`/`validateISIN`
// (`validators.ts`) and `validateIBAN`/`validateISIN`/`validateSWIFT`
// (`validationAdapter.ts`), so nothing in `src/` ever called it — only its own
// unit test did. `validationAdapter` has its own, unrelated `required()`, which
// is the one every form actually binds; having a second function of the same
// name one layer down was an invitation to reach for the wrong one.
//
// Note the two also disagreed on the question that matters: the domain one
// tested `value !== ""` without trimming, so a whitespace-only string passed.
// That is the defect `validationAdapter.required` was just fixed for.
// `VALIDATION_CODES.REQUIRED` stays in use — all three validators below return
// it for a blank input.

/**
 * Validates an International Bank Account Number (IBAN).
 * Checks length per country, format, and MOD-97 checksum.
 *
 * @param iban - The IBAN string to validate.
 * @returns Validation result with an error code describing the failure reason, if any.
 */
export function validateIBAN(iban: string): DomainValidationResult {
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return {isValid: false, error: VALIDATION_CODES.REQUIRED};

    const countryCode = cleaned.substring(0, 2);
    const expectedLength =
        IBAN_LENGTH_CODES[countryCode as keyof typeof IBAN_LENGTH_CODES];

    // Split out of the length comparison. The two used to be one step
    // (`cleaned.length !== IBAN_LENGTH_CODES[...]`), so a country absent from
    // the table produced an `undefined` lookup, failed the comparison, and was
    // reported as INVALID_LENGTH — telling the user their IBAN was the wrong
    // length when the real answer is that the country is not supported. No
    // length is even known for it, so that message could not have been right.
    //
    // `validateISIN` already returns INVALID_COUNTRY for exactly this
    // situation; the two validators simply disagreed.
    if (expectedLength === undefined) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_COUNTRY};
    }

    if (cleaned.length !== expectedLength) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_LENGTH};
    }

    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_FORMAT};
    }

    const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
    const numericString = convertToNumericString(rearranged);
    const isValid = BigInt(numericString) % RULE_CODES.MOD_97 === 1n;
    return isValid
        ? {isValid: true}
        : {isValid: false, error: VALIDATION_CODES.INVALID_CHECKSUM};
}

/**
 * Validates an International Securities Identification Number (ISIN).
 * Checks length (12 chars), format (2-letter country, 9 alphanumeric and check digit),
 * known country code, and Luhn checksum.
 *
 * @param isin - The ISIN string to validate.
 * @returns Validation result with an error code describing the failure reason, if any.
 */
export function validateISIN(isin: string): DomainValidationResult {
    const cleaned = isin.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return {isValid: false, error: VALIDATION_CODES.REQUIRED};
    if (cleaned.length !== 12)
        return {isValid: false, error: VALIDATION_CODES.INVALID_LENGTH};

    if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(cleaned)) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_FORMAT};
    }

    const countryCode = cleaned.substring(0, 2);
    if (!VALID_COUNTRY_CODES.has(countryCode)) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_COUNTRY};
    }

    const digits = cleaned.substring(0, 11);
    const numericString = convertToNumericString(digits);
    const checkDigit = calculateLuhnCheckDigit(
        numericString,
        RULE_CODES.LUHN_BASE
    );
    const providedCheckDigit = parseInt(cleaned[11], 10);

    return checkDigit === providedCheckDigit
        ? {isValid: true}
        : {isValid: false, error: VALIDATION_CODES.INVALID_CHECKSUM};
}

/**
 * Validates a SWIFT/BIC code.
 * Expected format: 4-letter bank code, 2-letter country code,
 * 2-character location code, and an optional 3-character branch code (8 or 11 chars total).
 *
 * @param swift - The SWIFT/BIC code to validate.
 * @returns Validation result with an error code describing the failure reason, if any.
 */
export function validateSWIFT(swift: string): DomainValidationResult {
    const cleaned = swift.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return {isValid: false, error: VALIDATION_CODES.REQUIRED};
    if (cleaned.length !== 8 && cleaned.length !== 11) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_LENGTH};
    }

    // This regex is the whole check, and it decomposes exactly as the doc
    // comment describes: `[A-Z]{4}` bank, `[A-Z]{2}` country, `[A-Z0-9]{2}`
    // location, optional `[A-Z0-9]{3}` branch.
    //
    // There used to be three further per-segment checks below it, re-testing
    // the bank code against `/^[A-Z]{4}$/`, the location code against
    // `/^[A-Z0-9]{2}$/` and the branch code against `/^[A-Z0-9]{3}$/`, each
    // returning its own code (INVALID_BANK / INVALID_REGION / INVALID_BRANCH).
    // Every one of them was already implied by the regex that had just passed,
    // so none could ever fail and none of those three codes could ever be
    // returned. They were removed rather than kept as defensive belt-and-braces
    // because they were not inert documentation: `swiftRules` mapped them to
    // real translated messages, so the message table advertised a specificity
    // ("Invalid bank", "Invalid region", "Invalid branch") the validator could
    // not actually produce. Any malformed BIC reports INVALID_FORMAT.
    //
    // Country code presence validates by the regex; a strict membership check
    // against VALID_COUNTRY_CODES is deliberately NOT done, to allow
    // specialized BIC country codes that are not in the standard list. That is
    // why VALIDATION_CODES.INVALID_COUNTRY is likewise not reachable from here
    // (unlike validateISIN, which does check membership and does return it).
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_FORMAT};
    }

    return {isValid: true};
}

/**
 * Calculates the Luhn check digit for the given numeric string.
 *
 * @param numericString - String of digits to process.
 * @param base - Numeric base for the algorithm (10 for decimal).
 * @returns The calculated check digit.
 */
function calculateLuhnCheckDigit(
    numericString: string,
    base: number
): number {
    let sum = 0;
    let shouldDouble = true;
    for (let i = numericString.length - 1; i >= 0; i--) {
        let digit = parseInt(numericString[i], 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit >= base) digit -= base - 1;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (base - (sum % base)) % base;
}

/**
 * Converts a string to a purely numeric string by replacing each uppercase
 * letter with its positional value (A=10, B=11, …, Z=35).
 * Used to prepare IBAN and ISIN strings for checksum calculations.
 *
 * @param text - Alphanumeric input string.
 * @returns Numeric string with letters expanded to their positional values.
 */
function convertToNumericString(text: string): string {
    return Array.from(text)
        .map((char) => {
            if (char >= "A" && char <= "Z") {
                return (char.charCodeAt(0) - RULE_CODES.CHAR_CODE_OFFSET).toString();
            }
            return char;
        })
        .join("");
}