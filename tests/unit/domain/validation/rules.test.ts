/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {validateIBAN, validateISIN, validateSWIFT} from "@/domain/validation/rules";
import {VALIDATION_CODES} from "@/domain/constants";

// The `required` block that used to open this file went with the function it
// covered — see the note in `domain/validation/rules.ts`. It was the module's
// only caller, and it pinned the untrimmed-string behaviour that
// `validationAdapter.required` was fixed for.
describe("Validation Rules", () => {
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

        it("should report an unsupported country as INVALID_COUNTRY", () => {
            // The country lookup used to be folded into the length comparison,
            // so an absent country produced `undefined`, failed the comparison,
            // and reported INVALID_LENGTH — a length claim for a country whose
            // length is not known. validateISIN already returned
            // INVALID_COUNTRY here.
            expect(validateIBAN("ZZ89370400440532013000")).toEqual({
                isValid: false,
                error: VALIDATION_CODES.INVALID_COUNTRY
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

        it("should accept the EU prefix used by European Union / EIB issues", () => {
            // `EU` is not an ISO-3166 country, so it was missing from
            // VALID_COUNTRY_CODES alongside the XS/XK securities prefixes that
            // were there — and isinRules blocked such a stock from being added
            // at all. Checksum-valid, so this fails on the country check alone
            // if the prefix is ever dropped again.
            expect(validateISIN("EU000A1G0AA6")).toEqual({isValid: true});
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

        it("reports every malformed segment as INVALID_FORMAT, not a per-segment code", () => {
            // The format regex already implies the bank/location/branch segment
            // checks, so the three per-segment codes it used to return
            // (INVALID_BANK / INVALID_REGION / INVALID_BRANCH) were unreachable
            // — while `swiftRules` still mapped each to its own translated
            // message. Both the checks and the codes are gone; this pins the
            // outcome set so a future "more specific message" change has to add
            // a validator path that can actually produce it.
            const malformed = [
                "1234DEFF",      // bank segment not all letters
                "DEUT12FF",      // country segment not all letters
                "DEUTDE-F",      // location segment not alphanumeric
                "DEUTDEFFX-X"    // branch segment not alphanumeric
            ];

            for (const bic of malformed) {
                expect(validateSWIFT(bic)).toEqual({
                    isValid: false,
                    error: VALIDATION_CODES.INVALID_FORMAT
                });
            }
        });
    });
});
