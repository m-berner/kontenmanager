/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {
    BackupData,
    BatchOperationDescriptor,
    BookingDb,
    BookingTypeDb,
    LegacyBackupData,
    LegacyBookingDb,
    LegacyStockDb,
    ModernBackupData,
    RecordOperation,
    StockDb
} from "@/domain/types";
import {validateBooking} from "@/domain/validation/validators";

export type ImportCounts = {
    accounts: number;
    stocks: number;
    bookings: number;
    bookingTypes: number;
};

export function buildLegacyImportPlan(input: {
    backup: LegacyBackupData;
    activeId: number;
    labels: Parameters<typeof createDefaultBookingTypes>[1];
    transformLegacyStock: (rec: LegacyStockDb, activeId: number) => StockDb;
    transformLegacyBooking: (
        rec: LegacyBookingDb,
        index: number,
        activeId: number
    ) => BookingDb;
}): {
    descriptors: BatchOperationDescriptor[];
    initData: {
        accountsDB: Array<ReturnType<typeof createDefaultAccount>>;
        bookingsDB: BookingDb[];
        bookingTypesDB: Array<Pick<BookingTypeDb, "cID" | "cName" | "cAccountNumberID">>;
        stocksDB: StockDb[];
    };
} {
    const accountsOps: Array<Extract<RecordOperation, { type: "add" }>> = [];
    const bookingOps: Array<Extract<RecordOperation, { type: "add" }>> = [];
    const bookingTypesOps: Array<Extract<RecordOperation, { type: "add" }>> = [];
    const stocksOps: Array<Extract<RecordOperation, { type: "add" }>> = [];

    const account = createDefaultAccount(input.activeId);
    accountsOps.push({type: "add", data: account});

    const bookingTypes = createDefaultBookingTypes(input.activeId, input.labels);
    for (const bt of bookingTypes) {
        bookingTypesOps.push({type: "add", data: bt});
    }

    if (input.backup.stocks && Array.isArray(input.backup.stocks)) {
        for (const rec of input.backup.stocks as LegacyStockDb[]) {
            const stock = input.transformLegacyStock(rec, input.activeId);
            stocksOps.push({type: "add", data: stock});
        }
    }

    if (input.backup.transfers) {
        for (let i = 0; i < (input.backup.transfers?.length ?? 0); i++) {
            const booking = input.transformLegacyBooking(
                input.backup.transfers[i] as LegacyBookingDb,
                i,
                input.activeId
            );
            bookingOps.push({
                type: "add",
                data: validateBooking(booking)
            });
        }
    }

    const descriptors: BatchOperationDescriptor[] = [
        {
            storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
            operations: [{type: "clear"}, ...accountsOps]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            operations: [{type: "clear"}, ...bookingTypesOps]
        },
        {
            storeName: INDEXED_DB.STORE.STOCKS.NAME,
            operations: [{type: "clear"}, ...stocksOps]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
            operations: [{type: "clear"}, ...bookingOps]
        }
    ];

    return {
        descriptors,
        initData: {
            accountsDB: [account],
            bookingsDB: bookingOps
                .map((r) => r.data as BookingDb)
                .filter((b) => b.cAccountNumberID === input.activeId),
            bookingTypesDB: bookingTypes,
            stocksDB: stocksOps
                .map((r) => r.data as StockDb)
                .filter((s) => s.cAccountNumberID === input.activeId)
        }
    };
}

export function buildModernImportPlan(input: {
    backup: ModernBackupData;
    activeId: number;
}): {
    descriptors: BatchOperationDescriptor[];
    initData: {
        accountsDB: ModernBackupData["accounts"];
        bookingsDB: BookingDb[];
        bookingTypesDB: BookingTypeDb[];
        stocksDB: StockDb[];
    };
} {
    const safeBackup = normalizeModernBackup(input.backup);

    const descriptors: BatchOperationDescriptor[] = [
        {
            storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.accounts)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.bookingTypes)]
        },
        {
            storeName: INDEXED_DB.STORE.STOCKS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.stocks)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.bookings)]
        }
    ];

    return {
        descriptors,
        initData: {
            accountsDB: safeBackup.accounts,
            bookingsDB: (safeBackup.bookings || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            ),
            bookingTypesDB: (safeBackup.bookingTypes || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            ),
            stocksDB: (safeBackup.stocks || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            )
        }
    };
}

export function createDefaultAccount(activeId: number): {
    cID: number;
    cSwift: string;
    cIban: string;
    cLogoUrl: string;
    cWithDepot: boolean;
} {
    return {
        cID: activeId,
        cSwift: "KMKLPJJ9",
        cIban: "XX13120300001064506999",
        cLogoUrl: "",
        cWithDepot: true
    };
}

export function createDefaultBookingTypes(
    activeId: number,
    labels: {
        buy: string;
        sell: string;
        dividend: string;
        other: string;
        fee: string;
        tax: string;
    }
): Array<Pick<BookingTypeDb, "cID" | "cName" | "cAccountNumberID">> {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

    const typeMapping: { cID: number; cName: string }[] = [
        {cID: BOOKING_TYPES.BUY, cName: labels.buy},
        {cID: BOOKING_TYPES.SELL, cName: labels.sell},
        {cID: BOOKING_TYPES.DIVIDEND, cName: labels.dividend},
        {cID: BOOKING_TYPES.CREDIT, cName: labels.other},
        {cID: BOOKING_TYPES.DEBIT, cName: labels.fee},
        {cID: BOOKING_TYPES.TAX, cName: labels.tax}
    ];

    return typeMapping.map((rec) => ({
        cID: rec.cID,
        cName: rec.cName,
        cAccountNumberID: activeId
    }));
}

export function getImportCounts(backup: BackupData): ImportCounts {
    if ("transfers" in backup) {
        return {
            accounts: 1,
            stocks: backup.stocks.length,
            bookings: backup.transfers.length,
            bookingTypes: 6
        };
    }

    return {
        accounts: backup.accounts.length,
        stocks: backup.stocks.length,
        bookings: backup.bookings.length,
        bookingTypes: backup.bookingTypes.length
    };
}

export function normalizeModernBackup(backup: ModernBackupData): ModernBackupData {
    const safeBackup = structuredClone(backup);
    safeBackup.bookings = (safeBackup.bookings || []).map((b) => validateBooking(b));
    return safeBackup;
}

export function toImportRecords<T>(data: T[]): RecordOperation[] {
    return data.map((rec) => ({type: "add" as const, data: rec}));
}