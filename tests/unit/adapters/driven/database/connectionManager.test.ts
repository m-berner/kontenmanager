/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createDatabaseConnectionManager} from "@/adapters/driven/database/connectionManager";
import type {DatabaseMigratorContract} from "@/domain/types";

type FakeOpenRequest = {
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
    onupgradeneeded: ((_ev: IDBVersionChangeEvent) => void) | null;
    onblocked: (() => void) | null;
    result: FakeDb;
    error: DOMException | null;
};

type FakeDb = {
    close: ReturnType<typeof vi.fn>;
    onversionchange: (() => void) | null;
    onclose: (() => void) | null;
};

function createFakeDb(): FakeDb {
    return {
        close: vi.fn(),
        onversionchange: null,
        onclose: null
    };
}

function createFakeOpenRequest(db: FakeDb): FakeOpenRequest {
    return {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
        result: db,
        error: null
    };
}

describe("DatabaseConnectionManager", () => {
    let openMock: ReturnType<typeof vi.fn>;
    let migrator: DatabaseMigratorContract;
    let fakeDb: FakeDb;
    let fakeRequest: FakeOpenRequest;

    beforeEach(() => {
        fakeDb = createFakeDb();
        fakeRequest = createFakeOpenRequest(fakeDb);
        openMock = vi.fn().mockReturnValue(fakeRequest);
        vi.stubGlobal("indexedDB", {open: openMock});
        migrator = {setupDatabase: vi.fn()};
    });

    it("connects successfully and exposes the connected database", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);

        const promise = manager.connect();
        fakeRequest.onsuccess?.();
        await promise;

        expect(manager.isConnected()).toBe(true);
        expect(manager.getDatabase()).toBe(fakeDb);
        expect(openMock).toHaveBeenCalledWith("db", 1);
    });

    it("shares one in-flight promise across concurrent connect() calls", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);

        const first = manager.connect();
        const second = manager.connect();
        fakeRequest.onsuccess?.();
        await Promise.all([first, second]);

        expect(openMock).toHaveBeenCalledTimes(1);
    });

    it("resolves immediately without reopening once already connected", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        const promise = manager.connect();
        fakeRequest.onsuccess?.();
        await promise;

        await manager.connect();

        expect(openMock).toHaveBeenCalledTimes(1);
    });

    it("rejects with an AppError on request error and resets connection state", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);

        const promise = manager.connect();
        fakeRequest.onerror?.();

        await expect(promise).rejects.toThrow();
        expect(manager.isConnected()).toBe(false);
    });

    it("rejects on onblocked but still runs the migrator when onupgradeneeded fires afterward", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);

        const promise = manager.connect();
        fakeRequest.onblocked?.();
        await expect(promise).rejects.toThrow();

        fakeRequest.onupgradeneeded?.({oldVersion: 0, newVersion: 1} as IDBVersionChangeEvent);

        expect(migrator.setupDatabase).toHaveBeenCalledWith(
            fakeDb,
            expect.objectContaining({oldVersion: 0, newVersion: 1})
        );
    });

    it("closes and discards the database if onsuccess fires after the attempt was abandoned by onblocked", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);

        const promise = manager.connect();
        fakeRequest.onblocked?.();
        await expect(promise).rejects.toThrow();

        fakeRequest.onsuccess?.();

        expect(fakeDb.close).toHaveBeenCalled();
        expect(manager.isConnected()).toBe(false);
    });

    it("disconnect() closes the database and resets connection state", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        const promise = manager.connect();
        fakeRequest.onsuccess?.();
        await promise;

        await manager.disconnect();

        expect(fakeDb.close).toHaveBeenCalled();
        expect(manager.isConnected()).toBe(false);
    });

    it("disconnect() is a no-op when not connected", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        await manager.disconnect();
        expect(fakeDb.close).not.toHaveBeenCalled();
    });

    it("getDatabase() throws when not connected", () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        expect(() => manager.getDatabase()).toThrow();
    });

    it("onversionchange closes the db, resets state, and invokes the registered handler instead of reloading", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        const promise = manager.connect();
        fakeRequest.onsuccess?.();
        await promise;

        const handler = vi.fn();
        manager.onVersionChange(handler);

        fakeDb.onversionchange?.();

        expect(fakeDb.close).toHaveBeenCalled();
        expect(manager.isConnected()).toBe(false);
        expect(handler).toHaveBeenCalled();
    });

    it("onclose resets connection state", async () => {
        const manager = createDatabaseConnectionManager("db", 1, migrator);
        const promise = manager.connect();
        fakeRequest.onsuccess?.();
        await promise;

        fakeDb.onclose?.();

        expect(manager.isConnected()).toBe(false);
    });
});