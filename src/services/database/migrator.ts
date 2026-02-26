/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/configs/database";
import {DomainUtils} from "@/domains/utils";

/**
 * Handles database setup, store creation, and migrations.
 */
export class DatabaseMigrator {
    /**
     * Handles IndexedDB `onupgradeneeded` events by creating stores and running
     * required migrations based on version changes.
     *
     * @param db - Opened database instance.
     * @param ev - Version change event providing old/new versions.
     */
    setupDatabase(db: IDBDatabase, ev: IDBVersionChangeEvent): void {
        const oldVersion = ev.oldVersion;
        const newVersion = ev.newVersion || INDEXED_DB.CURRENT_VERSION;

        DomainUtils.log(
            "SERVICES DATABASE migrator: upgrade",
            {oldVersion, newVersion},
            "info"
        );

        if (oldVersion < 1) {
            this.createStores(db);
        }

        this.runMigrations(db, oldVersion, newVersion);
    }

    /**
     * Creates all required object stores and indices if they do not yet exist.
     *
     * Idempotent: Safe to call during upgrades where stores might already exist.
     *
     * @param db - Database to create stores in.
     */
    private createStores(db: IDBDatabase): void {
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

        // Bookings store
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
                {unique: true}
            );
            store.createIndex(
                `${INDEXED_DB.STORE.STOCKS.NAME}_uk2`,
                INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL,
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

    /**
     * Executes schema/content migrations between versions.
     *
     * @param _db - Database instance.
     * @param _oldVersion - Previous schema version.
     * @param _newVersion - Target schema version.
     */
    private runMigrations(
        _db: IDBDatabase,
        _oldVersion: number,
        _newVersion: number
    ): void {
        // Placeholder for future migrations
    }
}

DomainUtils.log("SERVICES DATABASE migrator");
