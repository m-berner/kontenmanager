/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RecordsPort, SettingsPort} from "@/app/usecases/ports";

import {BROWSER_STORAGE} from "@/domain/constants";
import type {
    AccountRecord,
    BookingDb,
    BookingTypeDb,
    RecordsDbData,
    StockRecord,
    StorageValueType
} from "@/domain/types";
import {validateAccount, validateBooking, validateBookingType, validateStock} from "@/domain/validation/validators";

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
        items: AccountRecord[];
        add: (_account: AccountRecord, _prepend?: boolean) => void;
        update: (_account: AccountRecord) => void;
        remove: (_accountId: number) => void;
    };
    bookingTypes: {
        items: BookingTypeDb[];
        add: (_bt: BookingTypeDb, _prepend?: boolean) => void;
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
        items: StockRecord[];
        add: (_stock: StockRecord, _prepend?: boolean) => void;
        update: (_stock: StockRecord) => void;
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

/**
 * Maps the record stores onto the RecordsPort the usecases depend on.
 *
 * Every `add`/`update` is normalized through the *same* domain validator the
 * matching repository applies before writing to IndexedDB. Without this, the
 * two sides could disagree: a usecase persists via
 * `repositories.X.save(data)` — which validates — but then hands the store its
 * own *raw* `data`, so the DB held the normalized record while the in-memory
 * store held whatever the caller passed, until the next full reload re-read
 * from IndexedDB.
 *
 * That is not hypothetical: it is exactly how a share count typed into a
 * Vuetify `type="number"` field (a string, see validationAdapter.countRules)
 * reached the store as a string and turned `calculatePortfolioByStockId`'s
 * `acc + entry.cCount` into string concatenation — 100 + "10" = "10010" —
 * corrupting holdings, invest value and the depot total for the session.
 *
 * Validating here rather than in each usecase keeps the invariant at the single
 * boundary the app layer actually writes through, so a future usecase cannot
 * reintroduce the divergence by forgetting to normalize.
 *
 * Note `init` is deliberately NOT wrapped: it takes whole-store `RecordsDbData`
 * rather than one record, and every caller already validates (backup import via
 * `validateBooking`/`applyBookingRoleInvariants`, app boot straight from
 * IndexedDB, which only ever received validated writes).
 */
export function toRecordsPort(records: RecordsLike): RecordsPort {
    return {
        accounts: {
            get items() {
                return records.accounts.items;
            },
            add: (account, prepend) => records.accounts.add(validateAccount(account), prepend),
            update: (account) => records.accounts.update(validateAccount(account)),
            remove: records.accounts.remove.bind(records.accounts)
        },
        bookingTypes: {
            get items() {
                return records.bookingTypes.items;
            },
            add: (bt, prepend) => records.bookingTypes.add(validateBookingType(bt), prepend),
            update: (bt) => records.bookingTypes.update(validateBookingType(bt)),
            remove: records.bookingTypes.remove.bind(records.bookingTypes)
        },
        bookings: {
            get items() {
                return records.bookings.items;
            },
            add: (booking, prepend) => records.bookings.add(validateBooking(booking), prepend),
            update: (booking) => records.bookings.update(validateBooking(booking)),
            remove: records.bookings.remove.bind(records.bookings)
        },
        stocks: {
            // `validateStock` rebuilds the record from an explicit cXxx
            // whitelist, dropping the RAM-only m* fields — which is what we
            // want: `stocks.add` re-seeds them from STOCK_MEMORY defaults, and
            // `stocks.update` re-attaches the *existing* item's RAM data, so
            // live quote values survive an update either way.
            get items() {
                return records.stocks.items;
            },
            add: (stock, prepend) => records.stocks.add(validateStock(stock), prepend),
            update: (stock) => records.stocks.update(validateStock(stock)),
            remove: records.stocks.remove.bind(records.stocks)
        },
        clean: records.clean.bind(records),
        init: records.init.bind(records)
    };
}
