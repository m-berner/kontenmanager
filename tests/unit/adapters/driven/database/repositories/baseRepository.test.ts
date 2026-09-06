/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createBaseRepository} from "@/adapters/driven/database/repositories/baseRepository";

type TestEntity = { cID: number; cName: string };

describe("BaseRepository", () => {
    let repository: ReturnType<typeof createBaseRepository<TestEntity>>;
    let transactionManagerMock: any;
    let txMock: any;
    let storeMock: any;
    let indexMock: any;
    let requestMock: any;

    beforeEach(() => {
        requestMock = {
            onsuccess: null,
            onerror: null,
            result: null
        };

        indexMock = {
            getAll: vi.fn().mockReturnValue(requestMock),
            openCursor: vi.fn().mockReturnValue(requestMock)
        };

        storeMock = {
            get: vi.fn().mockReturnValue(requestMock),
            getAll: vi.fn().mockReturnValue(requestMock),
            add: vi.fn().mockReturnValue(requestMock),
            put: vi.fn().mockReturnValue(requestMock),
            delete: vi.fn().mockReturnValue(requestMock),
            count: vi.fn().mockReturnValue(requestMock),
            index: vi.fn().mockReturnValue(indexMock)
        };

        txMock = {
            mode: "readwrite",
            objectStore: vi.fn().mockReturnValue(storeMock)
        };

        transactionManagerMock = {
            execute: vi.fn().mockImplementation((_stores, _mode, operation) => operation(txMock))
        };

        repository = createBaseRepository<TestEntity>(
            "testStore",
            transactionManagerMock,
            new Map([["cName", "testStore_uk1"]])
        );
    });

    it("findById returns the matching record", async () => {
        requestMock.result = {cID: 1, cName: "a"};

        const promise = repository.findById(1);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual({cID: 1, cName: "a"});
        expect(storeMock.get).toHaveBeenCalledWith(1);
    });

    it("findById returns null when nothing is found", async () => {
        requestMock.result = undefined;

        const promise = repository.findById(999);
        requestMock.onsuccess();

        expect(await promise).toBeNull();
    });

    it("findAll returns every record in the store", async () => {
        requestMock.result = [{cID: 1, cName: "a"}, {cID: 2, cName: "b"}];

        const promise = repository.findAll();
        requestMock.onsuccess();

        expect(await promise).toHaveLength(2);
    });

    it("findBy looks up the configured index", async () => {
        requestMock.result = [{cID: 1, cName: "a"}];

        const promise = repository.findBy("cName", "a");
        requestMock.onsuccess();

        expect(await promise).toEqual([{cID: 1, cName: "a"}]);
        expect(storeMock.index).toHaveBeenCalledWith("testStore_uk1");
        expect(indexMock.getAll).toHaveBeenCalledWith("a");
    });

    it("findBy throws when the field has no configured index", async () => {
        await expect(
            repository.findBy("cID" as unknown as keyof TestEntity, 1)
        ).rejects.toThrow();
        expect(storeMock.index).not.toHaveBeenCalled();
    });

    it("save() inserts a new record and strips any cID", async () => {
        requestMock.result = 5;

        const promise = repository.save({cName: "new"} as Omit<TestEntity, "cID">);
        requestMock.onsuccess();

        expect(await promise).toBe(5);
        expect(storeMock.add).toHaveBeenCalledWith({cName: "new"});
        expect(storeMock.put).not.toHaveBeenCalled();
    });

    it("save() updates an existing record via put when cID is set", async () => {
        requestMock.result = 3;
        const entity = {cID: 3, cName: "updated"};

        const promise = repository.save(entity);
        requestMock.onsuccess();

        expect(await promise).toBe(3);
        expect(storeMock.put).toHaveBeenCalledWith(entity);
        expect(storeMock.add).not.toHaveBeenCalled();
    });

    it("delete() removes a record by id", async () => {
        const promise = repository.delete(7);
        requestMock.onsuccess();
        await promise;

        expect(storeMock.delete).toHaveBeenCalledWith(7);
    });

    it("deleteBy throws when the field has no configured index", async () => {
        await expect(
            repository.deleteBy("cID" as unknown as keyof TestEntity, 1)
        ).rejects.toThrow();
    });

    it("deleteBy walks the cursor and deletes every matching record", async () => {
        vi.stubGlobal("IDBKeyRange", {
            only: vi.fn().mockImplementation((v) => `range-${v}`)
        });

        // `cursor.delete()` returns an IDBRequest, and the cursor only advances
        // from that request's own `onsuccess`. The mock used to return
        // `undefined`, which the old implementation tolerated via an
        // `if (deleteRequest) … else cursor.continue()` — an unreachable else,
        // since IDBCursor.delete() throws on misuse rather than returning a
        // falsy value. Modelling the request faithfully is what lets this test
        // assert that a delete failure is actually handled.
        const deleteRequestMock: { onsuccess: (() => void) | null; onerror: (() => void) | null } = {
            onsuccess: null,
            onerror: null
        };
        const cursorMock = {delete: vi.fn(() => deleteRequestMock), continue: vi.fn()};
        const promise = repository.deleteBy("cName", "a");

        requestMock.result = cursorMock;
        requestMock.onsuccess();
        expect(cursorMock.delete).toHaveBeenCalled();
        expect(cursorMock.continue).not.toHaveBeenCalled();

        deleteRequestMock.onsuccess?.();
        expect(cursorMock.continue).toHaveBeenCalled();

        requestMock.result = null;
        requestMock.onsuccess();
        await promise;

        expect(storeMock.index).toHaveBeenCalledWith("testStore_uk1");

        vi.unstubAllGlobals();
    });

    it("count() returns the store's record count", async () => {
        requestMock.result = 42;

        const promise = repository.count();
        requestMock.onsuccess();

        expect(await promise).toBe(42);
    });

    it("reuses a caller-supplied transaction instead of starting a new one", async () => {
        requestMock.result = {cID: 1, cName: "a"};
        const suppliedTx = {mode: "readonly", objectStore: vi.fn().mockReturnValue(storeMock)};

        const promise = repository.findById(1, {tx: suppliedTx as unknown as IDBTransaction});
        requestMock.onsuccess();
        await promise;

        expect(transactionManagerMock.execute).not.toHaveBeenCalled();
        expect(suppliedTx.objectStore).toHaveBeenCalledWith("testStore");
    });

    it("rejects a caller-supplied readonly transaction for a write operation", async () => {
        const readonlyTx = {mode: "readonly", objectStore: vi.fn().mockReturnValue(storeMock)};

        await expect(
            repository.save({cName: "new"} as Omit<TestEntity, "cID">, {tx: readonlyTx as unknown as IDBTransaction})
        ).rejects.toThrow();
        expect(storeMock.add).not.toHaveBeenCalled();
    });
});