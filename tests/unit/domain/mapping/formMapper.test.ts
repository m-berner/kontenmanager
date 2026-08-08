/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {BOOKING_TYPE_ROLE, DATE} from "@/domain/constants";
import {formMapper} from "@/domain/mapping/formMapper";
import type {BookingFormData} from "@/domain/types";

// Deliberately not 1/2/3 (INDEXED_DB.STORE.BOOKING_TYPES.BUY/SELL/DIVIDEND) — booking-type ids
// are only ever 1/2/3 for the first depot account ever created in a given IndexedDB instance,
// so classification must follow each type's cRole, not its raw cID.
const NON_STANDARD_BUY_ID = 104;
const NON_STANDARD_DIVIDEND_ID = 106;
const NON_STANDARD_SELL_ID = 105;
const NON_STANDARD_OTHER_ID = 107;
const ACCOUNT_BOOKING_TYPES = [
    {cID: NON_STANDARD_BUY_ID, cRole: BOOKING_TYPE_ROLE.BUY},
    {cID: NON_STANDARD_SELL_ID, cRole: BOOKING_TYPE_ROLE.SELL},
    {cID: NON_STANDARD_DIVIDEND_ID, cRole: BOOKING_TYPE_ROLE.DIVIDEND},
    {cID: NON_STANDARD_OTHER_ID, cRole: BOOKING_TYPE_ROLE.OTHER}
];

function makeBookingFormData(overrides: Partial<BookingFormData> = {}): BookingFormData {
    return {
        id: -1,
        selected: NON_STANDARD_BUY_ID,
        bookDate: "2024-01-02",
        exDate: "2024-01-03",
        credit: 0,
        debit: 100,
        description: "Test",
        count: 10,
        stockId: 5,
        sourceTaxCredit: 3,
        sourceTaxDebit: 0,
        transactionTaxCredit: 4,
        transactionTaxDebit: 0,
        taxCredit: 1,
        taxDebit: 0,
        feeCredit: 2,
        feeDebit: 0,
        soliCredit: 5,
        soliDebit: 0,
        marketPlace: "XETRA",
        ...overrides
    };
}

describe("domains/mapping/formMapper", () => {
    it("mapAccountForm normalizes swift/iban and trims logoUrl", () => {
        const {mapAccountForm} = formMapper();
        const res = mapAccountForm({
            id: -1,
            swift: "  deutdeff  ",
            iban: " de89 3704 0044 0532 0130 00 ",
            logoUrl: "  http://logo  ",
            withDepot: true, currency: "EUR"
        });

        expect(res).toEqual({
            cSwift: "DEUTDEFF",
            cIban: "DE89370400440532013000",
            cLogoUrl: "http://logo",
            cWithDepot: true, cCurrency: "EUR"
        });
    });

    it("mapAccountForm includes cID when id > 0", () => {
        const {mapAccountForm} = formMapper();
        const res = mapAccountForm({
            id: 7,
            swift: "s",
            iban: "i",
            logoUrl: "",
            withDepot: false, currency: "EUR"
        });

        expect(res).toEqual({
            cID: 7,
            cSwift: "S",
            cIban: "I",
            cLogoUrl: "",
            cWithDepot: false, cCurrency: "EUR"
        });
    });

    it("mapStockForm normalizes isin/symbol, trims fields, and sets accountId", () => {
        const {mapStockForm} = formMapper();
        const res = mapStockForm(
            {
                id: -1,
                isin: " us 037833 1005 ",
                company: " Apple Inc. ",
                symbol: " aapl ",
                meetingDay: "",
                quarterDay: "",
                fadeOut: true,
                firstPage: false,
                url: " https://example.com ",
                askDates: DATE.ISO
            },
            42
        );

        expect(res).toEqual({
            cISIN: "US0378331005",
            cCompany: "Apple Inc.",
            cSymbol: "AAPL",
            cMeetingDay: "",
            cQuarterDay: "",
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: "https://example.com",
            cAccountNumberID: 42,
            cAskDates: DATE.ISO
        });
    });

    it("mapBookingForm omits cID for a non-positive OR undefined id, so an update dialog must never reach it with a missing record", () => {
        // `data.id > 0` is false for `undefined` just as it is for -1, so both
        // produce an insert-shaped object with no cID — which baseRepository.save()
        // then routes to store.add(), creating a DUPLICATE booking rather than
        // updating one. UpdateBooking.vue populated the form via
        // `Object.assign({id: booking?.cID, …})`, so a missing record silently
        // turned an update into an insert; it now bails out before mapping.
        const {mapBookingForm} = formMapper();

        const base = {
            selected: NON_STANDARD_BUY_ID,
            bookDate: "2024-01-02",
            exDate: "",
            credit: 0,
            debit: 100,
            description: "",
            count: 10,
            bookingTypeId: NON_STANDARD_BUY_ID,
            accountTypeId: 0,
            stockId: 5,
            sourceTaxCredit: 0,
            sourceTaxDebit: 0,
            transactionTaxCredit: 0,
            transactionTaxDebit: 0,
            taxCredit: 0,
            taxDebit: 0,
            feeCredit: 0,
            feeDebit: 0,
            soliCredit: 0,
            soliDebit: 0,
            marketPlace: ""
        };

        const fromMissingRecord = mapBookingForm(
            {...base, id: undefined as unknown as number},
            1,
            DATE.ISO,
            ACCOUNT_BOOKING_TYPES
        );
        const fromNewForm = mapBookingForm({...base, id: -1}, 1, DATE.ISO, ACCOUNT_BOOKING_TYPES);
        const fromRealUpdate = mapBookingForm({...base, id: 7}, 1, DATE.ISO, ACCOUNT_BOOKING_TYPES);

        expect(fromMissingRecord).not.toHaveProperty("cID");
        expect(fromNewForm).not.toHaveProperty("cID");
        expect(fromRealUpdate).toHaveProperty("cID", 7);
    });

    it("mapBookingForm sets stock fields only for stock-related types and exDate only for dividend", () => {
        const {mapBookingForm} = formMapper();

        const buy = mapBookingForm(
            {
                id: -1,
                selected: NON_STANDARD_BUY_ID,
                bookDate: "2024-01-02",
                exDate: "2024-01-03",
                credit: 0,
                debit: 100,
                description: "  Buy  ",
                count: 10,
                stockId: 5,
                sourceTaxCredit: 0,
                sourceTaxDebit: 0,
                transactionTaxCredit: 0,
                transactionTaxDebit: 0,
                taxCredit: 0,
                taxDebit: 0,
                feeCredit: 0,
                feeDebit: 0,
                soliCredit: 0,
                soliDebit: 0,
                marketPlace: "  XETRA  "
            },
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );

        expect(buy).toMatchObject({
            cAccountNumberID: 1,
            cBookDate: "2024-01-02",
            cDescription: "Buy",
            cBookingTypeID: NON_STANDARD_BUY_ID,
            cStockID: 5,
            cCount: 10,
            cExDate: "1970-01-01",
            cMarketPlace: "XETRA"
        });

        const dividend = mapBookingForm(
            {
                id: -1,
                selected: NON_STANDARD_DIVIDEND_ID,
                bookDate: "2024-02-01",
                exDate: "2024-02-15",
                credit: 10,
                debit: 0,
                description: "  Div  ",
                count: 1,
                stockId: 9,
                sourceTaxCredit: 0,
                sourceTaxDebit: 0,
                transactionTaxCredit: 0,
                transactionTaxDebit: 0,
                taxCredit: 0,
                taxDebit: 0,
                feeCredit: 0,
                feeDebit: 0,
                soliCredit: 0,
                soliDebit: 0,
                marketPlace: ""
            },
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );

        expect(dividend).toMatchObject({
            cBookingTypeID: NON_STANDARD_DIVIDEND_ID,
            cStockID: 9,
            cCount: 1,
            cExDate: "2024-02-15"
        });
    });

    it("mapBookingForm clears tax/soli/sourceTax/fee/transactionTax fields not valid for the selected type's role", () => {
        const {mapBookingForm} = formMapper();

        // Buy: fee + transactionTax are kept, tax/soli/sourceTax are cleared
        // (BookingForm.vue only shows those sell/dividend roles).
        const buy = mapBookingForm(
            makeBookingFormData({selected: NON_STANDARD_BUY_ID}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );
        expect(buy).toMatchObject({
            cFeeCredit: 2,
            cTransactionTaxCredit: 4,
            cTaxCredit: 0,
            cSoliCredit: 0,
            cSourceTaxCredit: 0
        });

        // Sell: fee + tax/soli/sourceTax are kept, transactionTax is cleared
        // (BookingForm.vue only shows transactionTax for the buy role).
        const sell = mapBookingForm(
            makeBookingFormData({selected: NON_STANDARD_SELL_ID}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );
        expect(sell).toMatchObject({
            cFeeCredit: 2,
            cTaxCredit: 1,
            cSoliCredit: 5,
            cSourceTaxCredit: 3,
            cTransactionTaxCredit: 0
        });

        // Switching to a non-stock-related ("other") type must clear every one
        // of these fields, not just the stock/exDate/marketPlace ones already
        // covered above. Otherwise, a stale amount typed in before switching
        // types would silently persist and be counted in fee/tax totals.
        const other = mapBookingForm(
            makeBookingFormData({selected: NON_STANDARD_OTHER_ID}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );
        expect(other).toMatchObject({
            cFeeCredit: 0,
            cFeeDebit: 0,
            cTaxCredit: 0,
            cTaxDebit: 0,
            cSoliCredit: 0,
            cSoliDebit: 0,
            cSourceTaxCredit: 0,
            cSourceTaxDebit: 0,
            cTransactionTaxCredit: 0,
            cTransactionTaxDebit: 0,
            cStockID: 0,
            cCount: 0,
            cMarketPlace: ""
        });
    });

    it("mapBookingForm clears marketPlace for a dividend booking (only shown for buy/sell)", () => {
        const {mapBookingForm} = formMapper();

        const dividend = mapBookingForm(
            makeBookingFormData({selected: NON_STANDARD_DIVIDEND_ID, marketPlace: "XETRA"}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );

        expect(dividend).toMatchObject({cMarketPlace: ""});
    });

    // BookingForm.vue binds `count` to a Vuetify `v-text-field type="number"`, whose
    // onInput assigns `el.value` verbatim — so `count` is typed `number` but holds a
    // *string* the moment the user types. The DB stayed correct (bookingRepository.save
    // runs validateBooking), but add/updateBookingUsecase push the mapper's output
    // straight into the Pinia store unvalidated, so a string cCount there turned
    // calculatePortfolioByStockId's `acc + entry.cCount` into string concatenation
    // (100 + "10" -> "10010") until the next full reload.
    it("mapBookingForm coerces a string count (Vuetify type=number emits strings) to a number", () => {
        const {mapBookingForm} = formMapper();

        const res = mapBookingForm(
            makeBookingFormData({count: "10" as unknown as number}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );

        expect(res.cCount).toBe(10);
        expect(typeof res.cCount).toBe("number");
    });

    it("mapBookingForm maps a fractional string count and a non-numeric one to 0", () => {
        const {mapBookingForm} = formMapper();

        const fractional = mapBookingForm(
            makeBookingFormData({count: "2.5" as unknown as number}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );
        expect(fractional.cCount).toBe(2.5);

        // Vuetify hands through an empty string when the field is cleared.
        const cleared = mapBookingForm(
            makeBookingFormData({count: "" as unknown as number}),
            1,
            "1970-01-01",
            ACCOUNT_BOOKING_TYPES
        );
        expect(cleared.cCount).toBe(0);
    });

    it("mapBookingTypeForm normalizes name and includes cID when id is set", () => {
        const {mapBookingTypeForm} = formMapper();

        const created = mapBookingTypeForm({id: null, name: "  Food   Drinks  ", role: BOOKING_TYPE_ROLE.OTHER}, 1);
        expect(created).toEqual({
            cName: "Food Drinks",
            cAccountNumberID: 1,
            cRole: BOOKING_TYPE_ROLE.OTHER
        });

        const updated = mapBookingTypeForm({id: 9, name: "  dividend  ", role: BOOKING_TYPE_ROLE.DIVIDEND}, 1);
        expect(updated).toEqual({
            cID: 9,
            cName: "dividend",
            cAccountNumberID: 1,
            cRole: BOOKING_TYPE_ROLE.DIVIDEND
        });
    });
});
