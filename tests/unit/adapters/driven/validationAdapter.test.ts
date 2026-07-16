/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {ref} from "vue";
import {
    cleanString,
    createRule,
    ibanRules,
    isinRules,
    isoDateRules,
    oneOfTwo,
    required,
    stringLength,
    swiftRules
} from "@/adapters/driven/validationAdapter";

// A valid IBAN/ISIN/SWIFT are needed to reach the "duplicate" and "checksum-passed" branches.
const VALID_IBAN = "DE89370400440532013000";
const VALID_ISIN = "US0378331005";
const VALID_SWIFT = "DEUTDEFF";

describe("validationAdapter", () => {
    describe("createRule / required / stringLength", () => {
        it("createRule returns true when the validator passes", () => {
            const rule = createRule(() => true, "err");
            expect(rule("anything")).toBe(true);
        });

        it("createRule returns the message when the validator fails", () => {
            const rule = createRule(() => false, "custom error");
            expect(rule("anything")).toBe("custom error");
        });

        it("required rejects null/undefined/empty string", () => {
            const rule = required("required!");
            expect(rule(null)).toBe("required!");
            expect(rule(undefined)).toBe("required!");
            expect(rule("")).toBe("required!");
            expect(rule("x")).toBe(true);
        });

        it("stringLength enforces min/max after stripping whitespace", () => {
            const rule = stringLength(2, 4, "bad length");
            expect(rule("a")).toBe("bad length");
            expect(rule("abcde")).toBe("bad length");
            expect(rule("ab")).toBe(true);
            expect(rule("  a b  ")).toBe(true); // whitespace stripped -> "ab" (2 chars)
        });
    });

    describe("cleanString", () => {
        it("strips all whitespace from a string", () => {
            expect(cleanString(" a b\tc ")).toBe("abc");
        });

        it("returns null for non-string input", () => {
            expect(cleanString(42)).toBeNull();
            expect(cleanString(undefined)).toBeNull();
        });
    });

    describe("oneOfTwo", () => {
        it("rejects when both the value and the compared value are positive", () => {
            const rule = oneOfTwo(10, "only one may be set");
            expect(rule(5)).toBe("only one may be set");
        });

        it("allows a positive value when the compared value is zero", () => {
            const rule = oneOfTwo(0, "only one may be set");
            expect(rule(5)).toBe(true);
        });

        it("rejects a negative value regardless of the compared value", () => {
            const rule = oneOfTwo(0, "no negatives");
            expect(rule(-1)).toBe("no negatives");
        });

        it("accepts a reactive Ref for the compared value", () => {
            const zero = ref(0);
            const rule = oneOfTwo(zero, "err");
            expect(rule(5)).toBe(true);
            zero.value = 5;
            expect(rule(5)).toBe("err");
        });
    });

    describe("ibanRules", () => {
        const MSG = ["required", "length", "format", "checksum", "duplicate"] as const;

        it("reports required when empty", () => {
            const rules = ibanRules(MSG);
            expect(rules[0]("")).toBe("required");
        });

        it("reports checksum failure for a structurally valid but incorrect IBAN", () => {
            const rules = ibanRules(MSG);
            // Same length/format as VALID_IBAN, wrong check digits.
            expect(rules[1]("DE00370400440532013000")).toBe("checksum");
        });

        it("passes both domain rules for a valid IBAN", () => {
            const rules = ibanRules(MSG);
            expect(rules[0](VALID_IBAN)).toBe(true);
            expect(rules[1](VALID_IBAN)).toBe(true);
        });

        it("does not include a duplicate-check rule when no checker is supplied", () => {
            const rules = ibanRules(MSG);
            expect(rules).toHaveLength(2);
        });

        it("adds a duplicate-check rule when a checker is supplied, using the 5th message", () => {
            const isDuplicate = vi.fn().mockReturnValue(true);
            const rules = ibanRules(MSG, isDuplicate);

            expect(rules).toHaveLength(3);
            expect(rules[2](VALID_IBAN)).toBe("duplicate");
            expect(isDuplicate).toHaveBeenCalledWith(VALID_IBAN);
        });

        it("passes the duplicate-check rule when the checker reports no duplicate", () => {
            const isDuplicate = vi.fn().mockReturnValue(false);
            const rules = ibanRules(MSG, isDuplicate);

            expect(rules[2](VALID_IBAN)).toBe(true);
        });

        it("does not call the duplicate checker for a blank value (required rule already covers it)", () => {
            const isDuplicate = vi.fn().mockReturnValue(true);
            const rules = ibanRules(MSG, isDuplicate);

            expect(rules[2]("")).toBe(true);
            expect(isDuplicate).not.toHaveBeenCalled();
        });
    });

    describe("isinRules", () => {
        const MSG = ["required", "length", "format", "country", "checksum"];

        it("passes a valid ISIN", () => {
            const rules = isinRules(MSG);
            expect(rules[1](VALID_ISIN)).toBe(true);
        });

        it("reports checksum failure for an otherwise well-formed ISIN", () => {
            const rules = isinRules(MSG);
            expect(rules[1]("US0378331006")).toBe("checksum");
        });
    });

    describe("swiftRules", () => {
        const MSG = ["required", "length", "format", "bankCode", "countryCode", "locationCode", "branchCode", "test"];

        it("passes a valid 8-character SWIFT/BIC code", () => {
            const rules = swiftRules(MSG);
            expect(rules[1](VALID_SWIFT)).toBe(true);
        });

        it("reports a length error for a code of the wrong length", () => {
            const rules = swiftRules(MSG);
            expect(rules[1]("ABC")).toBe("length");
        });
    });

    describe("isoDateRules", () => {
        const MSG = ["format", "invalid"];

        it("reports a format error for a non-ISO string", () => {
            const rules = isoDateRules(MSG);
            expect(rules[0]("01/02/2026")).toBe("format");
        });

        it("passes a well-formed, valid ISO date", () => {
            const rules = isoDateRules(MSG);
            expect(rules[0]("2026-01-02")).toBe(true);
            expect(rules[1]("2026-01-02")).toBe(true);
        });

        it("reports invalid for a syntactically ISO-shaped but out-of-range date", () => {
            const rules = isoDateRules(MSG);
            // Shape matches \d{4}-\d{2}-\d{2}, but month 13 doesn't exist.
            expect(rules[0]("2026-13-01")).toBe(true);
            expect(rules[1]("2026-13-01")).toBe("invalid");
        });
    });
});