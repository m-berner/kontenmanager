/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {validationService} from "./validation";
import {ValidationRules} from "@/domains/validation/rules";
import {VALIDATION_CODES} from "@/domains/validation/codes";

describe("ValidationService (Bridge)", () => {
    describe("validateISIN", () => {
        it("should return true for valid ISINs via bridge", () => {
            expect(validationService.validateISIN("US0378331005")).toBe(true);
        });
    });

    describe("cleanString", () => {
        it("should remove all whitespace", () => {
            expect(validationService.cleanString(" DE 123 ")).toBe("DE123");
        });
    });
});

describe("ValidationRules (Domain Core)", () => {
    describe("validateISIN", () => {
        it("should return valid for Apple Inc.", () => {
            const res = ValidationRules.validateISIN("US0378331005");
            expect(res.isValid).toBe(true);
        });

        it("should return error code for invalid ISIN", () => {
            const res = ValidationRules.validateISIN("INVALID");
            expect(res.isValid).toBe(false);
            expect(res.error).toBe(VALIDATION_CODES.INVALID_LENGTH);
        });
    });

    describe("validateIBAN", () => {
        it("should return valid for German IBAN", () => {
            expect(
                ValidationRules.validateIBAN("DE13120300001064506999").isValid
            ).toBe(true);
        });
    });

    describe("validateSWIFT", () => {
        it("should return valid for 8 and 11 char BIC", () => {
            expect(ValidationRules.validateSWIFT("ABCDEFGH").isValid).toBe(true);
            expect(ValidationRules.validateSWIFT("ABCDEFGH123").isValid).toBe(true);
        });

        it("should return invalid length for 9 chars", () => {
            const res = ValidationRules.validateSWIFT("ABCDEFGHI");
            expect(res.isValid).toBe(false);
            expect(res.error).toBe(VALIDATION_CODES.INVALID_LENGTH);
        });
    });
});
