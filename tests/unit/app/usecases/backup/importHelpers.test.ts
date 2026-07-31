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
import type {ModernBackupData, StockDb} from "@/domain/types";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

describe("usecases/backup/importHelpers", () => {
    describe("getImportCounts", () => {
        it("counts a modern backup from each of its four entity arrays", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb()],
                stocks: [makeStockDb(), makeStockDb({cID: 2})],
                bookings: [],
                bookingTypes: [makeBookingTypeDb()]
            };
            expect(getImportCounts(backup)).toEqual({accounts: 1, stocks: 2, bookings: 0, bookingTypes: 1});
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
                sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [{cID: 1, cWithDepot: "true"}], // non-boolean withDepot from a hand-edited file
                stocks: [{cID: 1}], // missing cISIN/cSymbol entirely
                bookings: [{cID: 1}],
                bookingTypes: [{cID: 1, cName: "  Buy  "}] // needs whitespace normalization
            } as unknown as ModernBackupData;

            const result = normalizeModernBackup(backup);

            expect(result.accounts[0].cWithDepot).toBe(true);
            expect(result.stocks[0].cISIN).toBe("");
            expect(result.stocks[0].cSymbol).toBe("");
            expect(result.bookingTypes[0].cName).toBe("Buy");
            expect(result.bookings[0].cID).toBe(1);
        });

        it("does not mutate the original backup object", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb()],
                stocks: [],
                bookings: [],
                bookingTypes: []
            };
            const original = JSON.parse(JSON.stringify(backup));

            normalizeModernBackup(backup);

            expect(backup).toEqual(original);
        });

        it("tolerates missing entity arrays by defaulting to empty arrays", () => {
            const backup = {sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"}} as unknown as ModernBackupData;
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
                sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                accounts: [makeAccountDb({cID: 1})],
                stocks: [{cID: 1, cAccountNumberID: 1} as unknown as StockDb],
                bookings: [],
                bookingTypes: []
            };

            const plan = buildModernImportPlan({backup, activeId: 1});

            const stocksDescriptor = plan.descriptors.find((d) => d.storeName === INDEXED_DB.STORE.STOCKS.NAME);
            const addOp = stocksDescriptor?.operations.find((op) => op.type === "add");
            expect((addOp as {data: StockDb}).data.cISIN).toBe(""); // normalized, not undefined
        });

        it("scopes initData to the active account id, excluding other accounts' records", () => {
            const backup: ModernBackupData = {
                sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
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