/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {vi} from "vitest";
import type {AccountDb, BookingDb, BookingTypeDb, RecordsDbData, StockDb, StorageValueType} from "@/domain/types";
import type {
    DatabaseAccountsPort,
    RecordsPort,
    RepositoriesPort,
    RuntimePort,
    SettingsPort,
    TransactionManagerPort
} from "@/app/usecases/ports";

export function makeAccountDb(partial: Partial<AccountDb> = {}): AccountDb {
    return {
        cID: partial.cID ?? 1,
        cSwift: partial.cSwift ?? "SWIFT",
        cIban: partial.cIban ?? "IBAN",
        cLogoUrl: partial.cLogoUrl ?? "",
        cWithDepot: partial.cWithDepot ?? false
    };
}

export function makeBookingTypeDb(partial: Partial<BookingTypeDb> = {}): BookingTypeDb {
    return {
        cID: partial.cID ?? 1,
        cName: partial.cName ?? "Type",
        cAccountNumberID: partial.cAccountNumberID ?? 1
    };
}

export function makeStockDb(partial: Partial<StockDb> = {}): StockDb {
    return {
        cID: partial.cID ?? 1,
        cCompany: partial.cCompany ?? "Company",
        cISIN: partial.cISIN ?? "ISIN",
        cSymbol: partial.cSymbol ?? "SYM",
        cFirstPage: partial.cFirstPage ?? 0,
        cFadeOut: partial.cFadeOut ?? 0,
        cMeetingDay: partial.cMeetingDay ?? "",
        cQuarterDay: partial.cQuarterDay ?? "",
        cURL: partial.cURL ?? "",
        cAccountNumberID: partial.cAccountNumberID ?? 1,
        cAskDates: partial.cAskDates ?? ""
    };
}

export function makeBookingDb(partial: Partial<BookingDb> = {}): BookingDb {
    return {
        cID: partial.cID ?? 1,
        cBookDate: partial.cBookDate ?? "",
        cExDate: partial.cExDate ?? "",
        cDebit: partial.cDebit ?? 0,
        cCredit: partial.cCredit ?? 0,
        cDescription: partial.cDescription ?? "",
        cCount: partial.cCount ?? 0,
        cBookingTypeID: partial.cBookingTypeID ?? 1,
        cAccountNumberID: partial.cAccountNumberID ?? 1,
        cStockID: partial.cStockID ?? 0,
        cSoliCredit: partial.cSoliCredit ?? 0,
        cSoliDebit: partial.cSoliDebit ?? 0,
        cTaxCredit: partial.cTaxCredit ?? 0,
        cTaxDebit: partial.cTaxDebit ?? 0,
        cFeeCredit: partial.cFeeCredit ?? 0,
        cFeeDebit: partial.cFeeDebit ?? 0,
        cSourceTaxCredit: partial.cSourceTaxCredit ?? 0,
        cSourceTaxDebit: partial.cSourceTaxDebit ?? 0,
        cTransactionTaxCredit: partial.cTransactionTaxCredit ?? 0,
        cTransactionTaxDebit: partial.cTransactionTaxDebit ?? 0,
        cMarketPlace: partial.cMarketPlace ?? ""
    };
}

export function createRuntimePortMock(overrides: Partial<RuntimePort> = {}): RuntimePort {
    return {
        resetTeleport: vi.fn(),
        ...overrides
    };
}

export function createSettingsPortMock(activeAccountId = -1): SettingsPort {
    return {activeAccountId};
}

export function createSetStorageMock() {
    return vi.fn<(_key: string, _value: StorageValueType) => Promise<void>>().mockResolvedValue(undefined);
}

export function createTransactionManagerMock(
    overrides: Partial<TransactionManagerPort> = {}
): TransactionManagerPort {
    return {
        execute: vi.fn(async (_storeNames, _mode, cb) => await cb({} as unknown as IDBTransaction)),
        ...overrides
    };
}

export function createDatabaseAccountsPortMock(
    overrides: Partial<DatabaseAccountsPort> = {}
): DatabaseAccountsPort {
    return {
        transactionManager: createTransactionManagerMock(),
        deleteAccountRecords: vi.fn().mockResolvedValue(undefined),
        getAccountRecords: vi.fn().mockResolvedValue({
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        } satisfies RecordsDbData),
        ...overrides
    };
}

export function createRecordsPortMock(input: {
    accountIds?: number[];
    init?: RecordsDbData;
} = {}): RecordsPort {
    const accountsItems = (input.accountIds ?? []).map((cID) => ({cID}));

    return {
        accounts: {
            items: accountsItems,
            add: vi.fn(),
            update: vi.fn(),
            remove: vi.fn()
        },
        bookingTypes: {
            add: vi.fn(),
            update: vi.fn(),
            remove: vi.fn()
        },
        bookings: {
            add: vi.fn(),
            update: vi.fn()
        },
        stocks: {
            add: vi.fn(),
            update: vi.fn()
        },
        clean: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined)
    };
}

export type RepositoriesPortOverrides = Partial<{
    accounts: Partial<RepositoriesPort["accounts"]>;
    bookings: Partial<RepositoriesPort["bookings"]>;
    bookingTypes: Partial<RepositoriesPort["bookingTypes"]>;
    stocks: Partial<RepositoriesPort["stocks"]>;
}>;

export function createRepositoriesPortMock(overrides: RepositoriesPortOverrides = {}): RepositoriesPort {
    const base: RepositoriesPort = {
        accounts: {save: vi.fn().mockResolvedValue(1)},
        bookings: {save: vi.fn().mockResolvedValue(1)},
        bookingTypes: {
            save: vi.fn().mockResolvedValue(1),
            delete: vi.fn().mockResolvedValue(undefined)
        },
        stocks: {save: vi.fn().mockResolvedValue(1)}
    };

    return {
        ...base,
        ...overrides,
        accounts: {...base.accounts, ...overrides.accounts},
        bookings: {...base.bookings, ...overrides.bookings},
        bookingTypes: {...base.bookingTypes, ...overrides.bookingTypes},
        stocks: {...base.stocks, ...overrides.stocks}
    };
}
