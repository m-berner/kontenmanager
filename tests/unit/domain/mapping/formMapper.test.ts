/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {DATE, INDEXED_DB} from "@/domain/constants";
import {formMapper} from "@/domain/mapping/formMapper";

describe("domains/mapping/formMapper", () => {
    it("mapAccountForm normalizes swift/iban and trims logoUrl", () => {
        const {mapAccountForm} = formMapper();
        const res = mapAccountForm({
            id: -1,
            swift: "  deutdeff  ",
            iban: " de89 3704 0044 0532 0130 00 ",
            logoUrl: "  http://logo  ",
            withDepot: true
        });

        expect(res).toEqual({
            cSwift: "DEUTDEFF",
            cIban: "DE89370400440532013000",
            cLogoUrl: "http://logo",
            cWithDepot: true
        });
    });

    it("mapAccountForm includes cID when id > 0", () => {
        const {mapAccountForm} = formMapper();
        const res = mapAccountForm({
            id: 7,
            swift: "s",
            iban: "i",
            logoUrl: "",
            withDepot: false
        });

        expect(res).toEqual({
            cID: 7,
            cSwift: "S",
            cIban: "I",
            cLogoUrl: "",
            cWithDepot: false
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
                fadeOut: 1,
                firstPage: 0,
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

    it("mapBookingForm sets stock fields only for stock-related types and exDate only for dividend", () => {
        const {mapBookingForm} = formMapper();

        const buy = mapBookingForm(
            {
                id: -1,
                selected: INDEXED_DB.STORE.BOOKING_TYPES.BUY,
                bookDate: "2024-01-02",
                exDate: "2024-01-03",
                credit: 0,
                debit: 100,
                description: "  Buy  ",
                count: 10,
                bookingTypeId: INDEXED_DB.STORE.BOOKING_TYPES.BUY,
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
                marketPlace: "  XETRA  "
            },
            1,
            "1970-01-01"
        );

        expect(buy).toMatchObject({
            cAccountNumberID: 1,
            cBookDate: "2024-01-02",
            cDescription: "Buy",
            cBookingTypeID: INDEXED_DB.STORE.BOOKING_TYPES.BUY,
            cStockID: 5,
            cCount: 10,
            cExDate: "1970-01-01",
            cMarketPlace: "XETRA"
        });

        const dividend = mapBookingForm(
            {
                id: -1,
                selected: INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND,
                bookDate: "2024-02-01",
                exDate: "2024-02-15",
                credit: 10,
                debit: 0,
                description: "  Div  ",
                count: 1,
                bookingTypeId: INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND,
                accountTypeId: 0,
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
            "1970-01-01"
        );

        expect(dividend).toMatchObject({
            cBookingTypeID: INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND,
            cStockID: 9,
            cCount: 1,
            cExDate: "2024-02-15"
        });
    });

    it("mapBookingTypeForm normalizes name and includes cID when id is set", () => {
        const {mapBookingTypeForm} = formMapper();

        const created = mapBookingTypeForm({id: null, name: "  Food   Drinks  "}, 1);
        expect(created).toEqual({
            cName: "Food Drinks",
            cAccountNumberID: 1
        });

        const updated = mapBookingTypeForm({id: 9, name: "  dividend  "}, 1);
        expect(updated).toEqual({
            cID: 9,
            cName: "dividend",
            cAccountNumberID: 1
        });
    });
});
