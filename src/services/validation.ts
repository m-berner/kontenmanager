/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    DomainValidationResult,
    ValidationCodeType,
    ValidationRuleType
} from "@/types";
import type {Ref} from "vue";
import {DomainUtils} from "@/domains/utils";
import {VALIDATION_CODES} from "@/domains/validation/codes";
import {ValidationRules} from "@/domains/validation/rules";

/**
 * Service providing validation rules and logic for forms and data integrity.
 * Includes complex validators for IBAN, ISIN, and SWIFT/BIC codes.
 *
 * This service acts as a bridge between the domain validation rules and Vuetify components.
 */
class ValidationServiceImpl {
    /**
     * Helper to create a Vuetify-compatible validation rule.
     *
     * @param validator - Boolean function to check validity.
     * @param message - Error message if invalid.
     * @returns A validation rule function.
     */
    createRule(
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
    cleanString(value: unknown): string | null {
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
    oneOfTwo(
        zeroValue: Ref<number> | number,
        message: string
    ): ValidationRuleType {
        return this.createRule((v) => {
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
    required(message: string): ValidationRuleType {
        return this.createRule(
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
    stringLength(
        min: number,
        max: number,
        message: string
    ): ValidationRuleType {
        return this.createRule((v) => {
            const cleaned = this.cleanString(v);
            if (!cleaned) return false;
            return cleaned.length >= min && cleaned.length <= max;
        }, message);
    }

    regex(pattern: RegExp, message: string): ValidationRuleType {
        return this.createRule((v) => {
            const cleaned = this.cleanString(v);
            if (!cleaned) return false;
            return pattern.test(cleaned);
        }, message);
    }

    nameRules(msgArray: string[]): ValidationRuleType[] {
        return [
            this.required(msgArray[0]),
            this.stringLength(2, 32, msgArray[1]),
            this.regex(/^[a-zA-ZäöüÄÖÜ].*/, msgArray[2])
        ];
    }

    bookingTypeRules(msgArray: string[]): ValidationRuleType[] {
        return [this.required(msgArray[0])];
    }

    amountRules(
        zeroValue: Ref<number> | number,
        msgArray: string[]
    ): ValidationRuleType[] {
        return [this.oneOfTwo(zeroValue, msgArray[0])];
    }

    validateIBAN(iban: string): boolean {
        return ValidationRules.validateIBAN(iban).isValid;
    }

    // ========================================================================
    // Complex Validations
    // ========================================================================

    isoDateRules(msgArray: string[]): ValidationRuleType[] {
        const isValid = (message: string): ValidationRuleType => {
            return this.createRule((v) => {
                const tv = v as string;
                const date = new Date(`${tv}T00:00:00Z`);
                return !isNaN(date.getTime());
            }, message);
        };
        return [
            this.regex(/^\d{4}-\d{2}-\d{2}$/, msgArray[0]),
            isValid(msgArray[1])
        ];
    }

    ibanRules(msgArray: readonly string[]): ValidationRuleType[] {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateIBAN(v as string), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[3],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }

    validateISIN(isin: string): boolean {
        return ValidationRules.validateISIN(isin).isValid;
    }

    isinRules(msgArray: string[]): ValidationRuleType[] {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateISIN(v as string), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[3],
                [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[4],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }

    swiftRules(msgArray: readonly string[]): ValidationRuleType[] {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateSWIFT(v as string), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_BANK]: msgArray[3],
                [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[4],
                [VALIDATION_CODES.INVALID_REGION]: msgArray[5],
                [VALIDATION_CODES.INVALID_BRANCH]: msgArray[6],
                [VALIDATION_CODES.TEST_BIC]: msgArray[7],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }

    /**
     * Map a domain DomainValidationResult to a Vuetify rule.
     */
    private fromDomain(
        domainFn: (_v: string) => DomainValidationResult,
        messageMap: Partial<Record<ValidationCodeType, string>>
    ): ValidationRuleType {
        return (v: unknown) => {
            const normalized = this.cleanString(v) ?? "";
            const res = domainFn(normalized);
            if (res.isValid) return true;
            return res.error ? messageMap[res.error] || "Invalid" : "Invalid";
        };
    }
}

// Export as a singleton instance
export const validationService = new ValidationServiceImpl();

// Also export the class for testing purposes
export {ValidationServiceImpl as ValidationService};

DomainUtils.log("SERVICES validation");
