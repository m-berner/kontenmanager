/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CURRENCIES, INDEXED_DB} from "@/domain/constants";
import type {AccountDb, BookingTypeDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {resolveLegacyBookingTypeRole} from "@/domain/validation/validators";

/**
 * Creates all required object stores and indices if they do not yet exist.
 * Idempotent: Safe to call during upgrades where stores might already exist.
 */
function createStores(db: IDBDatabase): void {
    // Accounts store
    if (!db.objectStoreNames.contains(INDEXED_DB.STORE.ACCOUNTS.NAME)) {
        const store = db.createObjectStore(INDEXED_DB.STORE.ACCOUNTS.NAME, {
            keyPath: INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID,
            autoIncrement: true
        });
        store.createIndex(
            `${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`,
            INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN,
            {unique: true}
        );
    }

    // Booking store
    if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKINGS.NAME)) {
        const store = db.createObjectStore(INDEXED_DB.STORE.BOOKINGS.NAME, {
            keyPath: INDEXED_DB.STORE.BOOKINGS.FIELDS.ID,
            autoIncrement: true
        });
        store.createIndex(
            `${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`,
            INDEXED_DB.STORE.BOOKINGS.FIELDS.BOOK_DATE,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`,
            INDEXED_DB.STORE.BOOKINGS.FIELDS.BOOKING_TYPE_ID,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`,
            INDEXED_DB.STORE.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`,
            INDEXED_DB.STORE.BOOKINGS.FIELDS.STOCK_ID,
            {unique: false}
        );
    }

    // Booking Types store
    if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKING_TYPES.NAME)) {
        const store = db.createObjectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME, {
            keyPath: INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID,
            autoIncrement: true
        });
        store.createIndex(
            `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`,
            INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID,
            {unique: false}
        );
    }

    // Stocks store
    if (!db.objectStoreNames.contains(INDEXED_DB.STORE.STOCKS.NAME)) {
        const store = db.createObjectStore(INDEXED_DB.STORE.STOCKS.NAME, {
            keyPath: INDEXED_DB.STORE.STOCKS.FIELDS.ID,
            autoIncrement: true
        });
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_uk1`,
            INDEXED_DB.STORE.STOCKS.FIELDS.ISIN,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_uk2`,
            INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_uk3`,
            [
                INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID,
                INDEXED_DB.STORE.STOCKS.FIELDS.ISIN
            ],
            {unique: true}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_uk4`,
            [
                INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID,
                INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL
            ],
            {unique: true}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_k1`,
            INDEXED_DB.STORE.STOCKS.FIELDS.FADE_OUT,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_k2`,
            INDEXED_DB.STORE.STOCKS.FIELDS.FIRST_PAGE,
            {unique: false}
        );
        store.createIndex(
            `${INDEXED_DB.STORE.STOCKS.NAME}_k3`,
            INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID,
            {unique: false}
        );
    }
}

function migrateStocksAccountScopedUniqueness(tx: IDBTransaction): void {
    const storeName = INDEXED_DB.STORE.STOCKS.NAME;
    const accountField = INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID;
    const isinField = INDEXED_DB.STORE.STOCKS.FIELDS.ISIN;
    const symbolField = INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL;

    if (!tx.db.objectStoreNames.contains(storeName)) {
        return;
    }

    const store = tx.objectStore(storeName);

    if (store.indexNames.contains(`${storeName}_uk1`)) {
        store.deleteIndex(`${storeName}_uk1`);
    }
    store.createIndex(`${storeName}_uk1`, isinField, {unique: false});

    if (store.indexNames.contains(`${storeName}_uk2`)) {
        store.deleteIndex(`${storeName}_uk2`);
    }
    store.createIndex(`${storeName}_uk2`, symbolField, {unique: false});

    if (!store.indexNames.contains(`${storeName}_uk3`)) {
        store.createIndex(`${storeName}_uk3`, [accountField, isinField], {
            unique: true
        });
    }

    if (!store.indexNames.contains(`${storeName}_uk4`)) {
        store.createIndex(`${storeName}_uk4`, [accountField, symbolField], {
            unique: true
        });
    }
}

/**
 * Backfills the `cRole` field (buy/sell/dividend/other) on booking-type rows written
 * before that field existed, using a best-effort name/id-based guess
 * (`resolveLegacyBookingTypeRole`). Idempotent: rows that already have a `cRole` are
 * left untouched, so this is safe to leave wired in permanently rather than gating it
 * to a single version transition.
 */
function backfillBookingTypeRoles(tx: IDBTransaction): void {
    const storeName = INDEXED_DB.STORE.BOOKING_TYPES.NAME;

    if (!tx.db.objectStoreNames.contains(storeName)) {
        return;
    }

    const store = tx.objectStore(storeName);
    const request = store.openCursor();
    request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;
        const record = cursor.value as BookingTypeDb;
        if (!record.cRole) {
            cursor.update({
                ...record,
                cRole: resolveLegacyBookingTypeRole(record.cID, record.cName)
            });
        }
        cursor.continue();
    };
    // Without this the cursor's failure surfaces as an unhandled request error
    // that aborts the whole version-change transaction with none of the
    // migrator's own context attached.
    request.onerror = () => {
        log(
            "SERVICE DATABASE migrator: backfillBookingTypeRoles cursor failed",
            {storeName, error: request.error?.message},
            "error"
        );
    };
}

/**
 * Stamps `cCurrency` onto account rows written before schema 29, when accounts
 * had no currency of their own and every amount was implicitly EUR.
 *
 * EUR is the truthful default rather than a guess: until this migration the app
 * derived its currency from the UI language, and the German-language build is
 * what every existing database was created under. `validateAccount` applies the
 * same default on the import path, so a pre-v29 backup and a pre-v29 IndexedDB
 * row end up identical.
 *
 * Idempotent, like `backfillBookingTypeRoles` above: a row that already carries
 * a `cCurrency` is left alone, so this is safe to leave wired in permanently
 * rather than gated to a single version transition.
 */
function backfillAccountCurrency(tx: IDBTransaction): void {
    const storeName = INDEXED_DB.STORE.ACCOUNTS.NAME;

    if (!tx.db.objectStoreNames.contains(storeName)) {
        return;
    }

    const store = tx.objectStore(storeName);
    const request = store.openCursor();
    request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;
        const record = cursor.value as AccountDb;
        if (!record.cCurrency) {
            cursor.update({...record, cCurrency: CURRENCIES.EUR});
        }
        cursor.continue();
    };
    // Same reasoning as backfillBookingTypeRoles: without this the cursor's
    // failure surfaces as an unhandled request error that aborts the whole
    // version-change transaction with none of the migrator's context attached.
    request.onerror = () => {
        log(
            "SERVICE DATABASE migrator: backfillAccountCurrency cursor failed",
            {storeName, error: request.error?.message},
            "error"
        );
    };
}

/**
 * Executes schema/content migrations between versions.
 */
function runMigrations(
    _db: IDBDatabase,
    oldVersion: number,
    _newVersion: number,
    tx?: IDBTransaction
): void {
    if (!tx) {
        // Throwing, not returning. `tx` is the version-change transaction, which
        // the spec guarantees is present on the IDBOpenDBRequest throughout
        // `onupgradeneeded` — so its absence means something is fundamentally
        // wrong. Returning quietly was the dangerous half of an asymmetry:
        // `createStores(db)` has *already* run by this point and IndexedDB has
        // no implicit abort (see `connectionManager`'s own note), so the version
        // bump committed regardless and the database was recorded at the new
        // version with the data migrations never applied — permanently, since
        // the next open sees `oldVersion === newVersion` and skips the upgrade
        // path entirely. Nothing logged and nothing threw.
        //
        // An exception raised inside the `onupgradeneeded` handler aborts the
        // version-change transaction, so the open fails loudly and the old
        // version survives, which is recoverable. A silently half-upgraded
        // database is not.
        log(
            "SERVICE DATABASE migrator: no version-change transaction; aborting upgrade",
            {oldVersion},
            "error"
        );
        throw new Error("IndexedDB upgrade: version-change transaction unavailable");
    }

    if (oldVersion < 27) {
        migrateStocksAccountScopedUniqueness(tx);
    }

    if (oldVersion < 28) {
        backfillBookingTypeRoles(tx);
    }

    if (oldVersion < 29) {
        backfillAccountCurrency(tx);
    }
}

/**
 * Handles IndexedDB `onupgradeneeded` events by creating stores and running
 * required migrations based on version changes.
 *
 * @param db - Opened database instance.
 * @param ev - Version change event providing old/new versions.
 */
export function setupDatabase(db: IDBDatabase, ev: IDBVersionChangeEvent): void {
    const oldVersion = ev.oldVersion;
    const newVersion = ev.newVersion || INDEXED_DB.CURRENT_VERSION;
    const request = ev.target as IDBOpenDBRequest | null;
    const tx = request?.transaction ?? undefined;

    log(
        "SERVICE DATABASE migrator: upgrade",
        {oldVersion, newVersion},
        "info"
    );

    // Called unconditionally, not just for a brand-new database. createStores is
    // itself idempotent (every branch is guarded by objectStoreNames.contains),
    // and gating it on `oldVersion < 1` meant a database at version >= 1 that is
    // missing a store — e.g. after a partially failed earlier upgrade — could
    // never have it recreated, leaving every transaction naming that store to
    // fail for good.
    createStores(db);

    runMigrations(db, oldVersion, newVersion, tx);
}
