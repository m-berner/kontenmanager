/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {DomainValidationResult} from "@/types";
import {VALID_COUNTRY_CODES, VALIDATION_CODES} from "@/constants";

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

const RULE_CODES = {
    CHAR_CODE_OFFSET: 55,
    MOD_97: 97n,
    LUHN_BASE: 10
} as const;

/**
 * Validates that a given value is not null, undefined, or an empty string.
 *
 * @param value - The value to validate.
 * @returns An object indicating whether the value is valid, and an error code if invalid.
 */
export function required(value: unknown): DomainValidationResult {
    if (value === null || value === undefined || value === "") {
        return {isValid: false, error: VALIDATION_CODES.REQUIRED};
    }
    return {isValid: true};
}

/**
 * Validates an International Bank Account Number (IBAN).
 *
 * @param iban - The IBAN string to be validated.
 * @returns An object indicating whether the IBAN is valid or not.
 *                                  If invalid, the object contains an error code describing the reason.
 */
export function validateIBAN(iban: string): DomainValidationResult {
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return {isValid: false, error: VALIDATION_CODES.REQUIRED};

    const countryCode = cleaned.substring(0, 2);

    if (
        cleaned.length !==
        IBAN_LENGTH_CODES[countryCode as keyof typeof IBAN_LENGTH_CODES]
    ) {
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
 * Validates whether the given string is a valid ISIN (International Securities Identification Number).
 *
 * @param isin - The ISIN string to validate. It must consist of a 12-character alphanumeric code,
 *                        starting with a 2-letter country code, followed by 9 alphanumeric characters,
 *                        and ending with a single numeric check digit.
 * @returns An object containing the result of the validation. If the ISIN is valid,
 *                                    the `isValid` property will be `true`. If invalid, the `isValid` property
 *                                    will be `false` and an appropriate error code will be provided in the
 *                                    `error` property.
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
 * Validates a SWIFT code (also known as a BIC) according to the standard format.
 *
 * A SWIFT code should be either 8 or 11 characters long and follow the format:
 * - 4 letters for the bank code (A-Z)
 * - 2 letters for the country code (A-Z)
 * - 2 alphanumeric characters for the location code (A-Z0-9)
 * - Optionally, 3 alphanumeric characters for the branch code (A-Z0-9)
 *
 * @param swift - The SWIFT/BIC code to validate.
 * @returns An object containing the validation result. If the code is invalid, the result includes an error code indicating the reason for failure.
 */
export function validateSWIFT(swift: string): DomainValidationResult {
    const cleaned = swift.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return {isValid: false, error: VALIDATION_CODES.REQUIRED};
    if (cleaned.length !== 8 && cleaned.length !== 11) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_LENGTH};
    }

    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
        return {isValid: false, error: VALIDATION_CODES.INVALID_FORMAT};
    }

    const bankCode = cleaned.substring(0, 4);
    if (!/^[A-Z]{4}$/.test(bankCode))
        return {isValid: false, error: VALIDATION_CODES.INVALID_BANK};

    const countryCode = cleaned.substring(4, 6);
    if (!VALID_COUNTRY_CODES.has(countryCode)) {
        // Some BICs might use codes not in our standard list or specialized codes
        // For now, we only log it if we want to be strict, but let's allow it if it passes regex
    }

    const locationCode = cleaned.substring(6, 8);
    if (!/^[A-Z0-9]{2}$/.test(locationCode))
        return {isValid: false, error: VALIDATION_CODES.INVALID_REGION};

    if (cleaned.length === 11) {
        const branchCode = cleaned.substring(8, 11);
        if (!/^[A-Z0-9]{3}$/.test(branchCode))
            return {isValid: false, error: VALIDATION_CODES.INVALID_BRANCH};
    }

    return {isValid: true};
}

/**
 * Converts a given string into a numeric string by replacing uppercase alphabetical characters
 * with their corresponding numeric values based on their position in the alphabet.
 *
 * @param text - The input string to be converted.
 * @returns The resulting numeric string with uppercase letters converted to numbers.
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

/**
 * Calculates the Luhn check digit for the given numeric string based on the specified base.
 *
 * @param numericString - A string of numeric characters for which the Luhn check digit needs to be calculated.
 * @param base - The base used for the Luhn algorithm (e.g., 10 for decimal).
 * @returns The calculated Luhn check digit.
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
