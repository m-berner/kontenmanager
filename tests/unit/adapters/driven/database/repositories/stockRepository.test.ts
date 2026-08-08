/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createStockRepository} from "@/adapters/driven/database/repositories/stockRepository";
import {INDEXED_DB} from "@/domain/constants";

describe("StockRepository", () => {
    let repository: any;
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
            count: vi.fn().mockReturnValue(requestMock),
            openCursor: vi.fn().mockReturnValue(requestMock)
        };

        storeMock = {
            get: vi.fn().mockReturnValue(requestMock),
            getAll: vi.fn().mockReturnValue(requestMock),
            add: vi.fn().mockReturnValue(requestMock),
            put: vi.fn().mockReturnValue(requestMock),
            delete: vi.fn().mockReturnValue(requestMock),
            index: vi.fn().mockReturnValue(indexMock)
        };

        txMock = {
            objectStore: vi.fn().mockReturnValue(storeMock)
        };

        transactionManagerMock = {
            execute: vi.fn().mockImplementation((_stores, _mode, operation) => {
                return operation(txMock);
            })
        };

        repository = createStockRepository(transactionManagerMock);
    });

    it("should find stocks by account", async () => {
        const stocks = [{cID: 1, cAccountNumberID: 123, cISIN: "US123"}];
        requestMock.result = stocks;

        const promise = repository.findByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(stocks);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`);
        expect(indexMock.getAll).toHaveBeenCalledWith(123);
    });

    it("should delete stocks by account", async () => {
        vi.stubGlobal("IDBKeyRange", {
            only: vi.fn().mockImplementation((val) => `range-${val}`)
        });

        // `cursor.delete()` returns an IDBRequest and the cursor advances from
        // that request's own onsuccess — see baseRepository's deleteBy test.
        const deleteRequestMock: { onsuccess: (() => void) | null; onerror: (() => void) | null } = {
            onsuccess: null,
            onerror: null
        };
        const cursorMock = {
            delete: vi.fn(() => deleteRequestMock),
            continue: vi.fn()
        };

        const promise = repository.deleteByAccount(123);
        requestMock.result = cursorMock;
        if (requestMock.onsuccess) requestMock.onsuccess();

        expect(cursorMock.delete).toHaveBeenCalled();
        deleteRequestMock.onsuccess?.();
        expect(cursorMock.continue).toHaveBeenCalled();

        requestMock.result = null;
        if (requestMock.onsuccess) requestMock.onsuccess();

        await promise;
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`);
        vi.unstubAllGlobals();
    });

    // Counts through IDBIndex.count(key) rather than materializing every row
    // via findByAccount().length, so the mock resolves a NUMBER here, not an
    // array. That distinction is the point of the change: the old form
    // deserialized every matching record only to read `.length` off it.
    it("should count stocks for an account without materializing the rows", async () => {
        requestMock.result = 3;

        const promise = repository.countByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toBe(3);
        expect(indexMock.count).toHaveBeenCalledWith(123);
        expect(indexMock.getAll).not.toHaveBeenCalled();
    });
});
