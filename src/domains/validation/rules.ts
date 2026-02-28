/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {DomainValidationResult} from "@/types";
import {
    IBAN_LENGTH_CODES,
    RULE_CODES,
    VALID_COUNTRY_CODES,
    VALIDATION_CODES
} from "./codes";

export class ValidationRules {
    static required(value: unknown): DomainValidationResult {
        if (value === null || value === undefined || value === "") {
            return {isValid: false, error: VALIDATION_CODES.REQUIRED};
        }
        return {isValid: true};
    }

    static validateIBAN(iban: string): DomainValidationResult {
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
        const numericString = this.convertToNumericString(rearranged);
        const isValid = BigInt(numericString) % RULE_CODES.MOD_97 === 1n;
        return isValid
            ? {isValid: true}
            : {isValid: false, error: VALIDATION_CODES.INVALID_CHECKSUM};
    }

    static validateISIN(isin: string): DomainValidationResult {
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
        const numericString = this.convertToNumericString(digits);
        const checkDigit = this.calculateLuhnCheckDigit(
            numericString,
            RULE_CODES.LUHN_BASE
        );
        const providedCheckDigit = parseInt(cleaned[11], 10);

        return checkDigit === providedCheckDigit
            ? {isValid: true}
            : {isValid: false, error: VALIDATION_CODES.INVALID_CHECKSUM};
    }

    static validateSWIFT(swift: string): DomainValidationResult {
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

    private static convertToNumericString(text: string): string {
        return Array.from(text)
            .map((char) => {
                if (char >= "A" && char <= "Z") {
                    return (char.charCodeAt(0) - RULE_CODES.CHAR_CODE_OFFSET).toString();
                }
                return char;
            })
            .join("");
    }

    private static calculateLuhnCheckDigit(
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
}
