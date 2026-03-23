/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {required, validateIBAN, validateISIN, validateSWIFT} from "@/domain/validation/rules";
import {VALIDATION_CODES} from "@/domain/constants";

describe("Validation Rules", () => {
    describe("required", () => {
        it("should return valid for non-empty values", () => {
            expect(required("test")).toEqual({isValid: true});
            expect(required(123)).toEqual({isValid: true});
            expect(required(0)).toEqual({isValid: true});
            expect(required(false)).toEqual({isValid: true});
        });

        it("should return invalid for empty values", () => {
            expect(required(null)).toEqual({isValid: false, error: VALIDATION_CODES.REQUIRED});
            expect(required(undefined)).toEqual({isValid: false, error: VALIDATION_CODES.REQUIRED});
            expect(required("")).toEqual({isValid: false, error: VALIDATION_CODES.REQUIRED});
        });
    });

    describe("validateIBAN", () => {
        it("should validate a correct German IBAN", () => {
            // Sample DE IBAN (randomly generated valid IBAN for testing)
            expect(validateIBAN("DE89 3704 0044 0532 0130 00")).toEqual({isValid: true});
        });

        it("should return invalid for incorrect length", () => {
            expect(validateIBAN("DE123")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_LENGTH});
        });

        it("should return invalid for incorrect format", () => {
            // Invalid character '@'
            expect(validateIBAN("DE89 3704 0044 0532 0130 @0")).toEqual({
                isValid: false,
                error: VALIDATION_CODES.INVALID_FORMAT
            });
        });

        it("should return invalid for incorrect checksum", () => {
            // Change one digit of a valid IBAN
            expect(validateIBAN("DE88 3704 0044 0532 0130 00")).toEqual({
                isValid: false,
                error: VALIDATION_CODES.INVALID_CHECKSUM
            });
        });
    });

    describe("validateISIN", () => {
        it("should validate a correct ISIN", () => {
            // Apple ISIN
            expect(validateISIN("US0378331005")).toEqual({isValid: true});
        });

        it("should return invalid for incorrect length", () => {
            expect(validateISIN("US037833100")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_LENGTH});
        });

        it("should return invalid for incorrect country code", () => {
            expect(validateISIN("XX0378331005")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_COUNTRY});
        });

        it("should return invalid for incorrect checksum", () => {
            expect(validateISIN("US0378331004")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_CHECKSUM});
        });
    });

    describe("validateSWIFT", () => {
        it("should validate a correct 8-char SWIFT", () => {
            expect(validateSWIFT("DEUTDEFF")).toEqual({isValid: true});
        });

        it("should validate a correct 11-char SWIFT", () => {
            expect(validateSWIFT("DEUTDEFFXXX")).toEqual({isValid: true});
        });

        it("should return invalid for incorrect length", () => {
            expect(validateSWIFT("DEUTDEF")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_LENGTH});
        });

        it("should return invalid for incorrect format", () => {
            expect(validateSWIFT("1234DEFF")).toEqual({isValid: false, error: VALIDATION_CODES.INVALID_FORMAT});
        });
    });
});
