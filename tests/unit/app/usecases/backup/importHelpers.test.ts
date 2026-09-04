/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    buildModernImportPlan,
    getImportCounts,
    normalizeModernBackup,
    toImportRecords
} from "@/app/usecases/backup/importHelpers";
import {INDEXED_DB} from "@/domain/constants";
import type {AccountDb, ModernBackupData, StockDb} from "@/domain/types";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

describe("usecases/backup/importHelpers", () => {
    describe("getImportCounts", () => {
        it("counts a modern backup from each of its four entity arrays", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb()],
                stocks: [makeStockDb(), makeStockDb({cID: 2})],
                bookings: [],
                bookingTypes: [makeBookingTypeDb()]
            };
            expect(getImportCounts(backup)).toEqual({
                accounts: 1,
                stocks: 2,
                bookings: 0,
                bookingTypes: 1,
                undatedBookings: 0
            });
        });

        it("counts bookings with a blank or malformed cBookDate as undated", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [],
                stocks: [],
                // One valid, one blank, one in a non-ISO format. The last is the
                // reason the count uses isValidISODate rather than a blank test:
                // normalizeDate turns "15.03.2024" into "" during the import, so
                // it becomes undated too and must be reported as such.
                bookings: [
                    makeBookingDb({cID: 1, cBookDate: "2024-03-15"}),
                    makeBookingDb({cID: 2, cBookDate: ""}),
                    makeBookingDb({cID: 3, cBookDate: "15.03.2024"})
                ],
                bookingTypes: []
            };

            expect(getImportCounts(backup).undatedBookings).toBe(2);
        });
    });

    describe("toImportRecords", () => {
        it("wraps each item as an 'add' operation", () => {
            expect(toImportRecords([{a: 1}, {a: 2}])).toEqual([
                {type: "add", data: {a: 1}},
                {type: "add", data: {a: 2}}
            ]);
        });
    });

    describe("normalizeModernBackup", () => {
        it("validates and normalizes every entity array, not just bookings", () => {
            const backup = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [{cID: 1, cWithDepot: "true"}], // non-boolean withDepot from a hand-edited file
                stocks: [{cID: 1}], // missing cISIN/cSymbol entirely
                bookings: [{cID: 1}],
                bookingTypes: [{cID: 1, cName: "  Buy  "}] // needs whitespace normalization
            } as unknown as ModernBackupData;

            const result = normalizeModernBackup(backup);

            expect(result.accounts[0].cWithDepot).toBe(true);
            // Blank cISIN/cSymbol are omitted entirely (not left as ""), so
            // an IndexedDB add() doesn't index them — see
            // stripBlankStockIdentifiers()'s own doc comment for why.
            expect(result.stocks[0].cISIN).toBeUndefined();
            expect(result.stocks[0].cSymbol).toBeUndefined();
            expect(result.bookingTypes[0].cName).toBe("Buy");
            expect(result.bookings[0].cID).toBe(1);
        });

        it("omits a blank cIban entirely instead of leaving it as an empty string, so two accounts that both lack an IBAN don't collide on the unique cIban index", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [
                    makeAccountDb({cID: 1, cIban: ""}),
                    makeAccountDb({cID: 2, cIban: ""})
                ],
                stocks: [],
                bookings: [],
                bookingTypes: []
            };

            const result = normalizeModernBackup(backup);

            expect(Object.hasOwn(result.accounts[0], "cIban")).toBe(false);
            expect(Object.hasOwn(result.accounts[1], "cIban")).toBe(false);
        });

        it("keeps a non-blank cIban as-is", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1, cIban: "de1234567890"})],
                stocks: [],
                bookings: [],
                bookingTypes: []
            };

            const result = normalizeModernBackup(backup);

            expect(result.accounts[0].cIban).toBe("DE1234567890");
        });

        it("omits blank cISIN/cSymbol entirely instead of leaving them as an empty string, so two same-account stocks that both lack an identifier don't collide on the unique [accountId, cISIN]/[accountId, cSymbol] indexes", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [
                    makeStockDb({cID: 1, cAccountNumberID: 1, cISIN: "", cSymbol: ""}),
                    makeStockDb({cID: 2, cAccountNumberID: 1, cISIN: "", cSymbol: ""})
                ],
                bookings: [],
                bookingTypes: []
            };

            const result = normalizeModernBackup(backup);

            expect(Object.hasOwn(result.stocks[0], "cISIN")).toBe(false);
            expect(Object.hasOwn(result.stocks[0], "cSymbol")).toBe(false);
            expect(Object.hasOwn(result.stocks[1], "cISIN")).toBe(false);
            expect(Object.hasOwn(result.stocks[1], "cSymbol")).toBe(false);
        });

        it("keeps a non-blank cISIN/cSymbol as-is", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [makeStockDb({cID: 1, cAccountNumberID: 1, cISIN: "us0378331005", cSymbol: "aapl"})],
                bookings: [],
                bookingTypes: []
            };

            const result = normalizeModernBackup(backup);

            expect(result.stocks[0].cISIN).toBe("US0378331005");
            expect(result.stocks[0].cSymbol).toBe("AAPL");
        });

        it("does not mutate the original backup object", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb()],
                stocks: [],
                bookings: [],
                bookingTypes: []
            };
            const original = JSON.parse(JSON.stringify(backup));

            normalizeModernBackup(backup);

            expect(backup).toEqual(original);
        });

        it("clears role-inapplicable fields on a booking using the same backup's normalized booking types", () => {
            // A backup exported before roles existed (or hand-edited) can have a Buy-role
            // booking carrying a stray tax/soli value that shouldn't apply to it.
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [],
                bookingTypes: [makeBookingTypeDb({cID: 41, cAccountNumberID: 1, cRole: "buy"})],
                bookings: [
                    makeBookingDb({
                        cID: 1,
                        cAccountNumberID: 1,
                        cBookingTypeID: 41,
                        cStockID: 5,
                        cCount: 10,
                        cTax: -99,
                        cSoli: -99
                    })
                ]
            };

            const result = normalizeModernBackup(backup);

            expect(result.bookings[0]).toMatchObject({
                cStockID: 5,
                cCount: 10,
                cTax: 0,
                cSoli: 0
            });
        });

        it("tolerates missing entity arrays by defaulting to empty arrays", () => {
            const backup = {sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"}} as unknown as ModernBackupData;
            const result = normalizeModernBackup(backup);

            expect(result.accounts).toEqual([]);
            expect(result.stocks).toEqual([]);
            expect(result.bookings).toEqual([]);
            expect(result.bookingTypes).toEqual([]);
        });
    });

    describe("buildModernImportPlan", () => {
        it("normalizes the backup before building descriptors and initData", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [{cID: 1, cAccountNumberID: 1} as unknown as StockDb],
                bookings: [],
                bookingTypes: []
            };

            const plan = buildModernImportPlan({backup, activeId: 1});

            const stocksDescriptor = plan.descriptors.find((d) => d.storeName === INDEXED_DB.STORE.STOCKS.NAME);
            const addOp = stocksDescriptor?.operations.find((op) => op.type === "add");
            expect((addOp as {data: StockDb}).data.cCompany).toBe(""); // normalized from missing to ""
        });

        it("doesn't produce two 'add' operations with a colliding blank cISIN/cSymbol for the same account", () => {
            // Regression test: the stocks store's uk3/uk4 unique composite
            // indexes are keyed on [cAccountNumberID, cISIN] and
            // [cAccountNumberID, cSymbol]. A backup with two same-account
            // stocks that both lack an identifier (a hand-edited backup, or
            // a legacy import whose source data allowed blank ISINs) used to
            // leave both records with a literal cISIN: "" / cSymbol: "" —
            // IndexedDB indexes an explicit empty string as a real value, so
            // the second add() would violate the unique constraint and abort
            // the whole atomic import transaction.
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [
                    makeStockDb({cID: 1, cAccountNumberID: 1, cISIN: "", cSymbol: ""}),
                    makeStockDb({cID: 2, cAccountNumberID: 1, cISIN: "", cSymbol: ""})
                ],
                bookings: [],
                bookingTypes: []
            };

            const plan = buildModernImportPlan({backup, activeId: 1});

            const stocksDescriptor = plan.descriptors.find((d) => d.storeName === INDEXED_DB.STORE.STOCKS.NAME);
            const addOps = stocksDescriptor?.operations.filter((op) => op.type === "add") ?? [];
            expect(addOps).toHaveLength(2);
            for (const op of addOps) {
                expect(Object.hasOwn((op as {data: StockDb}).data, "cISIN")).toBe(false);
                expect(Object.hasOwn((op as {data: StockDb}).data, "cSymbol")).toBe(false);
            }
        });

        it("doesn't produce two 'add' operations with a colliding blank cIban", () => {
            // Regression test: the accounts store's uk1 index is unique:
            // true on cIban alone (a global constraint, not per-account). A
            // backup with two accounts that both lack an IBAN (a hand-edited
            // backup, or a legacy import whose source data allowed blank
            // IBANs) used to leave both records with a literal cIban: "" —
            // the second add() would violate the unique constraint and abort
            // the whole atomic import transaction, same failure shape as the
            // stocks case above.
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [
                    makeAccountDb({cID: 1, cIban: ""}),
                    makeAccountDb({cID: 2, cIban: ""})
                ],
                stocks: [],
                bookings: [],
                bookingTypes: []
            };

            const plan = buildModernImportPlan({backup, activeId: 1});

            const accountsDescriptor = plan.descriptors.find((d) => d.storeName === INDEXED_DB.STORE.ACCOUNTS.NAME);
            const addOps = accountsDescriptor?.operations.filter((op) => op.type === "add") ?? [];
            expect(addOps).toHaveLength(2);
            for (const op of addOps) {
                expect(Object.hasOwn((op as {data: AccountDb}).data, "cIban")).toBe(false);
            }
        });

        it("scopes initData to the active account id, excluding other accounts' records", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1}), makeAccountDb({cID: 2})],
                stocks: [makeStockDb({cAccountNumberID: 1}), makeStockDb({cID: 2, cAccountNumberID: 2})],
                bookings: [makeBookingDb({cAccountNumberID: 1}), makeBookingDb({cID: 2, cAccountNumberID: 2})],
                bookingTypes: [makeBookingTypeDb({cAccountNumberID: 1}), makeBookingTypeDb({cID: 2, cAccountNumberID: 2})]
            };

            const plan = buildModernImportPlan({backup, activeId: 1});

            expect(plan.initData.stocksDB).toHaveLength(1);
            expect(plan.initData.bookingsDB).toHaveLength(1);
            expect(plan.initData.bookingTypesDB).toHaveLength(1);
            expect(plan.initData.accountsDB).toHaveLength(2); // accounts are not filtered by activeId
        });
    });
});