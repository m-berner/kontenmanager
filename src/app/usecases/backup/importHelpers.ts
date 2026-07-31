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
    ModernBackupData,
    RecordOperation,
    StockDb
} from "@/domain/types";
import {validateAccount, validateBooking, validateBookingType, validateStock} from "@/domain/validation/validators";

export type ImportCounts = {
    accounts: number;
    stocks: number;
    bookings: number;
    bookingTypes: number;
};

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

export function getImportCounts(backup: BackupData): ImportCounts {
    return {
        accounts: backup.accounts.length,
        stocks: backup.stocks.length,
        bookings: backup.bookings.length,
        bookingTypes: backup.bookingTypes.length
    };
}

export function normalizeModernBackup(backup: ModernBackupData): ModernBackupData {
    const safeBackup = structuredClone(backup);
    safeBackup.accounts = (safeBackup.accounts || []).map((a) => validateAccount(a));
    safeBackup.bookingTypes = (safeBackup.bookingTypes || []).map((bt) => validateBookingType(bt));
    safeBackup.stocks = (safeBackup.stocks || []).map((s) => validateStock(s));
    safeBackup.bookings = (safeBackup.bookings || []).map((b) => validateBooking(b));
    return safeBackup;
}

export function toImportRecords<T>(data: T[]): RecordOperation[] {
    return data.map((rec) => ({type: "add" as const, data: rec}));
}