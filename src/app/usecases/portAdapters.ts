/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RecordsPort, SettingsPort} from "@/app/usecases/ports";

import {BROWSER_STORAGE} from "@/domain/constants";
import type {AccountDb, BookingDb, BookingTypeDb, RecordsDbData, StockDb, StorageValueType} from "@/domain/types";

/**
 * Structural contract for the record stores passed to port adapters.
 * Intentionally defined here (not imported from infra) to keep the app layer
 * free of Pinia/store imports.
 *
 * Serves a dual purpose:
 * - Input to `toRecordsPort()` — maps store methods to the RecordsPort
 *   interface that usecases depend on.
 * - Direct interface in composables (e.g., useImportDialog) that need access to
 *   `.items` for snapshot/rollback operations.
 */
export type RecordsLike = {
    accounts: {
        items: AccountDb[];
        add: (_account: AccountDb, _prepend?: boolean) => void;
        update: (_account: AccountDb) => void;
        remove: (_accountId: number) => void;
    };
    bookingTypes: {
        items: BookingTypeDb[];
        add: (_bt: BookingTypeDb) => void;
        update: (_bt: BookingTypeDb) => void;
        remove: (_id: number) => void;
    };
    bookings: {
        items: BookingDb[];
        add: (_booking: BookingDb, _prepend?: boolean) => void;
        update: (_booking: BookingDb) => void;
        remove: (_id: number) => void;
    };
    stocks: {
        items: StockDb[];
        add: (_stock: StockDb) => void;
        update: (_stock: StockDb) => void;
        remove: (_id: number) => void;
    };
    clean: (_hard?: boolean) => void;
    init: (_db: RecordsDbData, _messages: { title: string; message: string }) => Promise<void> | void;
};

export function toSettingsPort(settings: { activeAccountId: number }): SettingsPort {
    return {
        get activeAccountId() {
            return settings.activeAccountId;
        },
        set activeAccountId(value: number) {
            settings.activeAccountId = value;
        }
    };
}

/**
 * Sets the active account and persists it, reverting the in-memory value if
 * the storage write fails so it doesn't end up pointing at an account that
 * was never actually persisted.
 */
export async function setActiveAccountIdPersisted(
    deps: {
        settings: SettingsPort;
        setStorage: (_key: string, _value: StorageValueType) => Promise<void>;
    },
    id: number
): Promise<void> {
    const previous = deps.settings.activeAccountId;
    deps.settings.activeAccountId = id;
    try {
        await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, id);
    } catch (err) {
        deps.settings.activeAccountId = previous;
        throw err;
    }
}

export function toRecordsPort(records: RecordsLike): RecordsPort {
    return {
        accounts: {
            get items() {
                return records.accounts.items;
            },
            add: records.accounts.add.bind(records.accounts),
            update: records.accounts.update.bind(records.accounts),
            remove: records.accounts.remove.bind(records.accounts)
        },
        bookingTypes: {
            get items() {
                return records.bookingTypes.items;
            },
            add: records.bookingTypes.add.bind(records.bookingTypes),
            update: records.bookingTypes.update.bind(records.bookingTypes),
            remove: records.bookingTypes.remove.bind(records.bookingTypes)
        },
        bookings: {
            get items() {
                return records.bookings.items;
            },
            add: records.bookings.add.bind(records.bookings),
            update: records.bookings.update.bind(records.bookings),
            remove: records.bookings.remove.bind(records.bookings)
        },
        stocks: {
            get items() {
                return records.stocks.items;
            },
            add: records.stocks.add.bind(records.stocks),
            update: records.stocks.update.bind(records.stocks),
            remove: records.stocks.remove.bind(records.stocks)
        },
        clean: records.clean.bind(records),
        init: records.init.bind(records)
    };
}
