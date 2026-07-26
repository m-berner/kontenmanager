/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {setupDatabase} from "@/adapters/driven/database/migrator";
import {INDEXED_DB} from "@/domain/constants";

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
        const ev = {oldVersion: 0, newVersion: 27, target: null} as unknown as IDBVersionChangeEvent;

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
        const ev = {oldVersion: 0, newVersion: 27, target: null} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).not.toHaveBeenCalled();
    });

    it("skips store creation entirely when upgrading from an already-initialized database", () => {
        const {db} = createFakeDb();
        const ev = {oldVersion: 5, newVersion: 27, target: null} as unknown as IDBVersionChangeEvent;

        setupDatabase(db as IDBDatabase, ev);

        expect(db.createObjectStore).not.toHaveBeenCalled();
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
            createIndex: vi.fn()
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
        const tx = {
            db: {objectStoreNames: {contains: vi.fn().mockReturnValue(true)}},
            objectStore: vi.fn()
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

        expect(tx.objectStore).not.toHaveBeenCalled();
    });

    it("does nothing when there is no upgrade transaction available", () => {
        const db = {
            objectStoreNames: {contains: vi.fn().mockReturnValue(true)},
            createObjectStore: vi.fn()
        };
        const ev = {oldVersion: 5, newVersion: 27, target: null} as unknown as IDBVersionChangeEvent;

        expect(() => setupDatabase(db as unknown as IDBDatabase, ev)).not.toThrow();
    });
});