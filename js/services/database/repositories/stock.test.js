import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockRepository } from "./stock";
import { INDEXED_DB } from "@/configs/database";
describe("StockRepository", () => {
    let repository;
    let transactionManagerMock;
    let txMock;
    let storeMock;
    let indexMock;
    let requestMock;
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
        repository = new StockRepository(transactionManagerMock);
    });
    it("should find stocks by account", async () => {
        const stocks = [{ cID: 1, cAccountNumberID: 123, cISIN: "US123" }];
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
        const cursorMock = {
            delete: vi.fn(),
            continue: vi.fn()
        };
        const promise = repository.deleteByAccount(123);
        requestMock.result = cursorMock;
        if (requestMock.onsuccess)
            requestMock.onsuccess();
        expect(cursorMock.delete).toHaveBeenCalled();
        requestMock.result = null;
        if (requestMock.onsuccess)
            requestMock.onsuccess();
        await promise;
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`);
        vi.unstubAllGlobals();
    });
    it("should count stocks for an account", async () => {
        requestMock.result = [{}, {}, {}];
        const promise = repository.countByAccount(123);
        requestMock.onsuccess();
        const result = await promise;
        expect(result).toBe(3);
    });
});
