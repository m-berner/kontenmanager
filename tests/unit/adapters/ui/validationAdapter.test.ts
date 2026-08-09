/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {ref} from "vue";
import {
    cleanString,
    countRules,
    createRule,
    ibanRules,
    isinRules,
    isoDateRules,
    nameRules,
    oneOfTwo,
    required,
    stockRules,
    stringLength,
    swiftRules,
    symbolRules
} from "@/adapters/ui/validationAdapter";

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

        // StockForm's company field is the only one bound to a bare required(),
        // and an untrimmed check let "   " through: mapStockFormToDb then trims
        // it to cCompany: "", producing a nameless stock that renders as an empty
        // cell and as a blank row in BookingForm's picker — indistinguishable
        // from the sentinel "no stock" placeholder it also sorts next to.
        it("required rejects a whitespace-only string", () => {
            const rule = required("required!");
            expect(rule("   ")).toBe("required!");
            expect(rule("\t\n ")).toBe("required!");
            expect(rule(" x ")).toBe(true);
        });

        // Only strings are trimmed — presence of a non-string is not a
        // whitespace question, and required() is generic.
        it("required accepts non-string values unchanged", () => {
            const rule = required("required!");
            expect(rule(0)).toBe(true);
            expect(rule(false)).toBe(true);
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

    describe("stockRules", () => {
        it("rejects null, 0, and non-numbers, but accepts a positive stock id", () => {
            const [rule] = stockRules(["a company is required"]);
            expect(rule(null)).toBe("a company is required");
            // 0 is the sentinel id of the placeholder "no stock" row every
            // account carries — must be rejected like an unset value, unlike
            // a plain required() check which only rejects null/""/undefined.
            expect(rule(0)).toBe("a company is required");
            expect(rule("5")).toBe("a company is required");
            expect(rule(5)).toBe(true);
        });
    });

    describe("countRules", () => {
        it("rejects a negative count and accepts a positive one", () => {
            const [rule] = countRules(["count must not be negative"]);
            // A negative count silently inverts calculatePortfolioByStockId's
            // Buy/Sell math and corrupts calculateInvestByStockId's FIFO walk.
            expect(rule(-1)).toBe("count must not be negative");
            expect(rule(10)).toBe(true);
        });

        // The rule is only applied to BookingForm's count field, shown solely
        // for Buy/Sell/Dividend bookings — and a stock booking of zero shares
        // is meaningless: it adds nothing to the portfolio and is skipped by
        // calculateInvestByStockId's FIFO walk. Note zero was, for a while, the
        // ONLY value that could be saved (the rule rejected every typed string),
        // so rejecting it now also closes off that broken state.
        it("rejects a zero count for a stock booking", () => {
            const [rule] = countRules(["count required"]);
            expect(rule(0)).toBe("count required");
            expect(rule("0")).toBe("count required");
        });

        // BookingForm.vue binds count to a Vuetify `v-text-field type="number"`,
        // whose onInput assigns `el.value` verbatim — so every count the user
        // actually types reaches this rule as a STRING. Requiring `typeof v ===
        // "number"` therefore failed validation for any typed count, and
        // submitGuard returned early without saving and without an error alert:
        // no Buy/Sell/Dividend booking with a share count could be saved at all.
        // Only an untouched 0 (still a number) got through, which is exactly the
        // path the e2e addBooking test happens to exercise.
        it("accepts the numeric strings Vuetify's type=number field emits", () => {
            const [rule] = countRules(["count invalid"]);
            expect(rule("5")).toBe(true);
            expect(rule("10")).toBe(true);
            expect(rule("2.5")).toBe(true);
            expect(rule("  7  ")).toBe(true);
        });

        it("still rejects negative, empty and non-numeric string input", () => {
            const [rule] = countRules(["count invalid"]);
            expect(rule("-5")).toBe("count invalid");
            // Number("") is 0, so an emptied field must not slip through as valid.
            expect(rule("")).toBe("count invalid");
            expect(rule("   ")).toBe("count invalid");
            expect(rule("abc")).toBe("count invalid");
            expect(rule("10abc")).toBe("count invalid");
            expect(rule("Infinity")).toBe("count invalid");
            expect(rule(null)).toBe("count invalid");
            expect(rule(undefined)).toBe("count invalid");
            expect(rule(Number.NaN)).toBe("count invalid");
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
        // Slot order mirrors isinRules: required, length, format, country,
        // checksum, duplicate. `country` was inserted (not appended) when
        // validateIBAN stopped folding an unsupported country into
        // INVALID_LENGTH, so `duplicate` moved from index 4 to 5.
        const MSG = ["required", "length", "format", "country", "checksum", "duplicate"] as const;

        it("reports required when empty", () => {
            const rules = ibanRules(MSG);
            expect(rules[0]("")).toBe("required");
        });

        it("reports checksum failure for a structurally valid but incorrect IBAN", () => {
            const rules = ibanRules(MSG);
            // Same length/format as VALID_IBAN, wrong check digits.
            expect(rules[1]("DE00370400440532013000")).toBe("checksum");
        });

        it("reports an unsupported country as country, not as a length error", () => {
            // "ZZ" is not in IBAN_LENGTH_CODES. The lookup used to be folded
            // into the length comparison, so `undefined` failed it and the user
            // was told their IBAN was the wrong length — for a country whose
            // length is not even known. validateISIN already answered
            // INVALID_COUNTRY here; the two validators simply disagreed.
            const rules = ibanRules(MSG);
            expect(rules[1]("ZZ89370400440532013000")).toBe("country");
        });

        it("still reports a genuinely wrong length for a supported country", () => {
            const rules = ibanRules(MSG);
            // DE is in the table and expects 22 characters.
            expect(rules[1]("DE8937040044053201300")).toBe("length");
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

        it("adds a duplicate-check rule when a checker is supplied, using the 6th message", () => {
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

        it("rejects a day that does not exist in the given month", () => {
            // The rule used to test `!isNaN(new Date(v + "T00:00:00Z"))`, and
            // JavaScript's ISO parser range-checks the month but ROLLS THE DAY
            // OVER: "2024-02-31" parses to 2 March and passed. So the rule only
            // ever added month 00/13 rejection on top of the regex while
            // claiming to validate the date. It now delegates to the domain's
            // isValidISODate, which computes the real days-in-month.
            const rules = isoDateRules(MSG);

            for (const impossible of ["2024-02-31", "2024-02-30", "2024-04-31", "2023-02-29"]) {
                expect(rules[0](impossible)).toBe(true);
                expect(rules[1](impossible)).toBe("invalid");
            }

            // 2024 is a leap year, so this one is real and must still pass.
            expect(rules[1]("2024-02-29")).toBe(true);
        });

        it("rejects day 00 and month 00", () => {
            const rules = isoDateRules(MSG);
            expect(rules[1]("2024-00-10")).toBe("invalid");
            expect(rules[1]("2024-10-00")).toBe("invalid");
        });
    });

    describe("symbolRules", () => {
        const MSG = ["required", "length", "begin", "duplicate"] as const;

        it("keeps required / length / first-character checks", () => {
            const rules = symbolRules(MSG);

            expect(rules).toHaveLength(3);
            expect(rules[0]("")).toBe("required");
            expect(rules[1]("A".repeat(33))).toBe("length");
            // Punctuation start is what the first-character rule is actually for.
            expect(rules[2](".AAPL")).toBe("begin");
        });

        // symbolRules no longer delegates to nameRules, whose stringLength(2, 32)
        // made every one-character ticker unsaveable: F (Ford), T (AT&T),
        // V (Visa), C (Citigroup), K (Kellanova), X (US Steel). The form even
        // auto-fills this field from the provider, so the app supplied a value it
        // then refused to accept — and submitGuard's early return made that look
        // like a dead OK button. This test asserted the bug (`rules[1]("A")`
        // was expected to be "length").
        it.each(["F", "T", "V", "C", "K", "X"])(
            "accepts the one-character ticker %s",
            (symbol) => {
                const rules = symbolRules(MSG);

                expect(rules[0](symbol)).toBe(true);
                expect(rules[1](symbol)).toBe(true);
                expect(rules[2](symbol)).toBe(true);
            }
        );

        // The first-character rule used to require an ASCII letter or one of six
        // German umlauts, so a digit-leading symbol could not be entered at all
        // — and on Xetra that is an ordinary shape: 1COV (Covestro), 2GB, 3W9.
        // The symbol is the field with the least reason to require an alphabetic
        // start. This test asserted the bug: it expected "1AAPL" to be rejected.
        it("accepts digit-leading symbols like Xetra's 1COV", () => {
            const rules = symbolRules(MSG);

            expect(rules[2]("1COV")).toBe(true);
            expect(rules[2]("2GB")).toBe(true);
            expect(rules[2]("3W9")).toBe(true);
        });

        // The umlaut set was incomplete for its own apparent intent: ä ö ü Ä Ö Ü
        // were covered but ß and every accented Latin character were not. The
        // Unicode-aware \p{L} class privileges no alphabet.
        it("accepts non-ASCII letters the umlaut allowlist missed", () => {
            const rules = nameRules(MSG);

            expect(rules[2]("Ørsted")).toBe(true);
            expect(rules[2]("Éclair")).toBe(true);
            expect(rules[2]("ßeta")).toBe(true);
        });

        // The second consumer, and the one more likely to bite in daily use:
        // booking-type names are free-form user labels, created often, with no
        // reason to be constrained at all.
        it("accepts booking-type names starting with a digit", () => {
            const rules = nameRules(MSG);

            expect(rules[2]("1. Rate")).toBe(true);
            expect(rules[2]("2024 Gebühren")).toBe(true);
            // Still rejected — a punctuation start is the shape the rule targets.
            expect(rules[2]("§20 Abgeltungsteuer")).toBe("begin");
        });

        it("adds a duplicate-check rule when a checker is supplied, using the 4th message", () => {
            const isDuplicate = vi.fn().mockReturnValue(true);
            const rules = symbolRules(MSG, isDuplicate);

            expect(rules).toHaveLength(4);
            expect(rules[3]("AAPL")).toBe("duplicate");
        });

        it("uppercases before delegating, matching how mapStockFormToDb persists the symbol", () => {
            const isDuplicate = vi.fn().mockReturnValue(false);
            const rules = symbolRules(MSG, isDuplicate);

            expect(rules[3]("aapl")).toBe(true);
            expect(isDuplicate).toHaveBeenCalledWith("AAPL");
        });

        it("does not call the duplicate checker for a blank value", () => {
            const isDuplicate = vi.fn().mockReturnValue(true);
            const rules = symbolRules(MSG, isDuplicate);

            expect(rules[3]("")).toBe(true);
            expect(isDuplicate).not.toHaveBeenCalled();
        });
    });
});