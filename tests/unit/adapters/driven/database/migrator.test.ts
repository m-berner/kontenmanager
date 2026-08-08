/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {setupDatabase} from "@/adapters/driven/database/migrator";
import {BOOKING_TYPE_ROLE, INDEXED_DB} from "@/domain/constants";
import type {BookingTypeDb} from "@/domain/types";

/**
 * Simulates an IndexedDB cursor walk synchronously: assigning `onsuccess` on the
 * returned fake request immediately drives the whole iteration (each `cursor.continue()`
 * call inside the handler recurses into the next record), ending with a `null` result.
 */
function createFakeCursorRequest(records: BookingTypeDb[]) {
    const request: { onsuccess: ((event: unknown) => void) | null } = {onsuccess: null};
    Object.defineProperty(request, "onsuccess", {
        set(handler: (event: unknown) => void) {
            let index = 0;
            const fireNext = (): void => {
                if (index >= records.length) {
                    handler({target: {result: null}});
                    return;
                }
                const cursor = {
                    value: records[index],
                    update: vi.fn((updated: BookingTypeDb) => {
                        records[index] = updated;
                    }),
                    continue: vi.fn(() => {
                        index += 1;
                        fireNext();
                    })
                };
                handler({target: {result: cursor}});
            };
            fireNext();
        }
    });
    return request;
}

/**
 * A version-change transaction that satisfies both data migrations without
 * asserting anything about them.
 *
 * Needed by every `setupDatabase` test now that a missing transaction is fatal
 * rather than a quiet no-op: `runMigrations` throws, which aborts the
 * version-change transaction, so the store-creation tests must supply one.
 */
function createFakeUpgradeTx() {
    const storeMock = {
        indexNames: {contains: vi.fn().mockReturnValue(false)},
        deleteIndex: vi.fn(),
        createIndex: vi.fn(),
        openCursor: vi.fn(() => createFakeCursorRequest([]))
    };
    return {
        db: {objectStoreNames: {contains: vi.fn().mockReturnValue(true)}},
        objectStore: vi.fn().mockReturnValue(storeMock)
    };
}

function createFakeDb(existingStores: string[] = []) {
    const created = new Set<string>(existingStores);
    const storeMocks = new Map<string, any>();

    const db: any = {
        objectStoreNames: {
            contains: (name: string) => created.has(name)
        },
        createObjectStore: vi.fn((name: string) => {
            created.add(name);
            const store = {
                createIndex: vi.fn(),
                indexNames: {contains: vi.fn().mockReturnValue(false)}
            };
            storeMocks.set(name, store);
            return store;
        })
    };

    return {db, storeMocks};
}

describe("migrator: setupDatabase", () => {
    it("creates all four object stores with their indexes on a fresh database", () => {
        const {db} = createFakeDb();
        const ev = {oldVersion: 0, newVersion: 27, target: {transaction: createFakeUpgradeTx()}} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).toHaveBeenCalledWith(
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            expect.objectContaining({keyPath: "cID", autoIncrement: true})
        );
        expect(db.createObjectStore).toHaveBeenCalledWith(
            INDEXED_DB.STORE.BOOKINGS.NAME,
            expect.objectContaining({keyPath: "cID", autoIncrement: true})
        );
        expect(db.createObjectStore).toHaveBeenCalledWith(
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            expect.objectContaining({keyPath: "cID", autoIncrement: true})
        );
        expect(db.createObjectStore).toHaveBeenCalledWith(
            INDEXED_DB.STORE.STOCKS.NAME,
            expect.objectContaining({keyPath: "cID", autoIncrement: true})
        );
    });

    it("does not recreate stores that already exist (idempotent upgrade)", () => {
        const {db} = createFakeDb([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME
        ]);
        const ev = {oldVersion: 0, newVersion: 27, target: {transaction: createFakeUpgradeTx()}} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).not.toHaveBeenCalled();
    });

    it("does not recreate existing stores when upgrading an already-initialized database", () => {
        const {db} = createFakeDb([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME
        ]);
        const ev = {oldVersion: 5, newVersion: 27, target: {transaction: createFakeUpgradeTx()}} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).not.toHaveBeenCalled();
    });

    // createStores used to be gated on `oldVersion < 1`, so a database at any
    // later version that was missing a store — e.g. after a partially failed
    // earlier upgrade — could never have it recreated, and every transaction
    // naming that store failed for good. It is idempotent (each branch checks
    // objectStoreNames.contains), so it now runs on every upgrade.
    it("recreates a missing store even when upgrading from a later version", () => {
        // A v5 database that has lost its stocks store.
        const {db} = createFakeDb([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME
        ]);
        const ev = {oldVersion: 5, newVersion: 27, target: {transaction: createFakeUpgradeTx()}} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).toHaveBeenCalledWith(
            INDEXED_DB.STORE.STOCKS.NAME,
            {keyPath: INDEXED_DB.STORE.STOCKS.FIELDS.ID, autoIncrement: true}
        );
        // ...and only the missing one.
        expect(db.createObjectStore).toHaveBeenCalledTimes(1);
    });

    it("runs the stocks account-scoped uniqueness migration when upgrading from before version 27", () => {
        const accountField = INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID;
        const isinField = INDEXED_DB.STORE.STOCKS.FIELDS.ISIN;
        const symbolField = INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL;
        const storeName = INDEXED_DB.STORE.STOCKS.NAME;

        const storeMock = {
            indexNames: {
                contains: vi.fn((name: string) => name.endsWith("_uk1") || name.endsWith("_uk2"))
            },
            deleteIndex: vi.fn(),
            createIndex: vi.fn(),
            // Also exercised by the (unrelated, oldVersion < 28) booking-type role
            // backfill migration, which runs in the same upgrade.
            openCursor: vi.fn(() => createFakeCursorRequest([]))
        };
        const tx = {
            db: {objectStoreNames: {contains: vi.fn().mockReturnValue(true)}},
            objectStore: vi.fn().mockReturnValue(storeMock)
        };
        const db = {
            objectStoreNames: {contains: vi.fn().mockReturnValue(true)},
            createObjectStore: vi.fn()
        };
        const ev = {
            oldVersion: 20,
            newVersion: 27,
            target: {transaction: tx}
        } as unknown as IDBVersionChangeEvent;

        setupDatabase(db as unknown as IDBDatabase, ev);

        expect(storeMock.deleteIndex).toHaveBeenCalledWith(`${storeName}_uk1`);
        expect(storeMock.deleteIndex).toHaveBeenCalledWith(`${storeName}_uk2`);
        expect(storeMock.createIndex).toHaveBeenCalledWith(`${storeName}_uk1`, isinField, {unique: false});
        expect(storeMock.createIndex).toHaveBeenCalledWith(`${storeName}_uk2`, symbolField, {unique: false});
        expect(storeMock.createIndex).toHaveBeenCalledWith(
            `${storeName}_uk3`,
            [accountField, isinField],
            {unique: true}
        );
        expect(storeMock.createIndex).toHaveBeenCalledWith(
            `${storeName}_uk4`,
            [accountField, symbolField],
            {unique: true}
        );
    });

    it("skips the uniqueness migration when upgrading from version 27 or later", () => {
        const storeMock = {
            deleteIndex: vi.fn(),
            createIndex: vi.fn(),
            // Exercised by the (unrelated, oldVersion < 28) booking-type role backfill,
            // which still runs in this same upgrade since oldVersion 27 < 28.
            openCursor: vi.fn(() => createFakeCursorRequest([]))
        };
        const tx = {
            db: {objectStoreNames: {contains: vi.fn().mockReturnValue(true)}},
            objectStore: vi.fn().mockReturnValue(storeMock)
        };
        const db = {
            objectStoreNames: {contains: vi.fn().mockReturnValue(true)},
            createObjectStore: vi.fn()
        };
        const ev = {
            oldVersion: 27,
            newVersion: 28,
            target: {transaction: tx}
        } as unknown as IDBVersionChangeEvent;

        setupDatabase(db as unknown as IDBDatabase, ev);

        expect(storeMock.deleteIndex).not.toHaveBeenCalled();
        expect(storeMock.createIndex).not.toHaveBeenCalled();
    });

    describe("backfillBookingTypeRoles (oldVersion < 28)", () => {
        function createBackfillTx(records: BookingTypeDb[]) {
            const store = {openCursor: vi.fn(() => createFakeCursorRequest(records))};
            const tx = {
                db: {objectStoreNames: {contains: vi.fn().mockReturnValue(true)}},
                objectStore: vi.fn().mockReturnValue(store)
            };
            return {tx, store};
        }

        function run(records: BookingTypeDb[], oldVersion = 27) {
            const {tx, store} = createBackfillTx(records);
            const db = {
                objectStoreNames: {contains: vi.fn().mockReturnValue(true)},
                createObjectStore: vi.fn()
            };
            const ev = {
                oldVersion,
                newVersion: 28,
                target: {transaction: tx}
            } as unknown as IDBVersionChangeEvent;

            setupDatabase(db as unknown as IDBDatabase, ev);
            return {tx, store};
        }

        it("classifies a legacy row with a shipped default label and a non-1/2/3 id by name", () => {
            const records = [
                {cID: 104, cName: "Stock purchase", cAccountNumberID: 7} as unknown as BookingTypeDb
            ];

            run(records);

            expect(records[0].cRole).toBe(BOOKING_TYPE_ROLE.BUY);
        });

        it("classifies a legacy row via the German default label too", () => {
            const records = [
                {cID: 205, cName: "Aktienverkauf", cAccountNumberID: 3} as unknown as BookingTypeDb
            ];

            run(records);

            expect(records[0].cRole).toBe(BOOKING_TYPE_ROLE.SELL);
        });

        it("falls back to the historical global-cID convention when the name doesn't match", () => {
            const records = [
                {cID: INDEXED_DB.STORE.BOOKING_TYPES.BUY, cName: "", cAccountNumberID: 1} as unknown as BookingTypeDb
            ];

            run(records);

            expect(records[0].cRole).toBe(BOOKING_TYPE_ROLE.BUY);
        });

        it("defaults to 'other' for a custom name with no id match", () => {
            const records = [
                {cID: 999, cName: "Interest", cAccountNumberID: 1} as unknown as BookingTypeDb
            ];

            run(records);

            expect(records[0].cRole).toBe(BOOKING_TYPE_ROLE.OTHER);
        });

        it("is idempotent: a row that already has a cRole is left untouched", () => {
            const records: BookingTypeDb[] = [
                {cID: 1, cName: "Stock purchase", cAccountNumberID: 1, cRole: BOOKING_TYPE_ROLE.OTHER}
            ];

            const {store} = run(records);

            expect(records[0].cRole).toBe(BOOKING_TYPE_ROLE.OTHER);
            expect(store.openCursor).toHaveBeenCalledTimes(1);
        });

        it("does not run when upgrading from version 28 or later", () => {
            const records = [
                {cID: 104, cName: "Stock purchase", cAccountNumberID: 7} as unknown as BookingTypeDb
            ];
            const {store} = run(records, 28);

            expect(store.openCursor).not.toHaveBeenCalled();
        });
    });

    // THROWS when there is no version-change transaction; it used to return
    // quietly, which was the dangerous half of an asymmetry. `createStores(db)`
    // has already run by that point and IndexedDB has no implicit abort, so the
    // version bump committed regardless and the database was recorded at the new
    // version with the data migrations never applied — permanently, since the
    // next open sees oldVersion === newVersion and skips the upgrade path
    // entirely. Nothing logged and nothing threw.
    //
    // An exception raised inside the onupgradeneeded handler aborts the
    // version-change transaction, so the open fails loudly and the OLD version
    // survives. That is recoverable; a silently half-upgraded database is not.
    it("throws when there is no upgrade transaction, so the version bump cannot commit", () => {
        const db = {
            objectStoreNames: {contains: vi.fn().mockReturnValue(true)},
            createObjectStore: vi.fn()
        };
        const ev = {oldVersion: 5, newVersion: 27, target: null} as unknown as IDBVersionChangeEvent;

        expect(() => setupDatabase(db as unknown as IDBDatabase, ev)).toThrow();
    });
});