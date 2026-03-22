/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RecordsPort, SettingsPort} from "@/app/usecases/ports";

import type {AccountDb, BookingDb, BookingTypeDb, RecordsDbData, StockDb} from "@/domain/types";

/**
 * Structural contract for the records stores passed to port adapters.
 * Intentionally defined here (not imported from infra) to keep the app layer
 * free of Pinia/store imports.
 *
 * Serves a dual purpose:
 * - Input to `toRecordsPort()` — maps store methods to the narrower RecordsPort
 *   interface that use cases depend on.
 * - Direct interface in composables (e.g. useImportDialog) that need access to
 *   `.items` for snapshot/rollback operations, which RecordsPort does not expose.
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
    };
    stocks: {
        items: StockDb[];
        add: (_stock: StockDb) => void;
        update: (_stock: StockDb) => void;
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
            add: records.bookingTypes.add.bind(records.bookingTypes),
            update: records.bookingTypes.update.bind(records.bookingTypes),
            remove: records.bookingTypes.remove.bind(records.bookingTypes)
        },
        bookings: {
            add: records.bookings.add.bind(records.bookings),
            update: records.bookings.update.bind(records.bookings)
        },
        stocks: {
            add: records.stocks.add.bind(records.stocks),
            update: records.stocks.update.bind(records.stocks)
        },
        clean: records.clean.bind(records),
        init: records.init.bind(records)
    };
}
