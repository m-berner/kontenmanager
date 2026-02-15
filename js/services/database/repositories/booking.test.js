import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingRepository } from "./booking";
import { INDEXED_DB } from "@/configs/database";
describe("BookingRepository", () => {
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
        repository = new BookingRepository(transactionManagerMock);
    });
    it("should find bookings by account", async () => {
        const bookings = [{ cID: 1, cAccountNumberID: 123 }];
        requestMock.result = bookings;
        const promise = repository.findByAccount(123);
        requestMock.onsuccess();
        const result = await promise;
        expect(result).toEqual(bookings);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`);
        expect(indexMock.getAll).toHaveBeenCalledWith(123);
    });
    it("should find bookings by date", async () => {
        const bookings = [{ cID: 1, cBookDate: "2026-02-01" }];
        requestMock.result = bookings;
        const promise = repository.findByDate("2026-02-01");
        requestMock.onsuccess();
        const result = await promise;
        expect(result).toEqual(bookings);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`);
        expect(indexMock.getAll).toHaveBeenCalledWith("2026-02-01");
    });
    it("should delete bookings by account", async () => {
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
        expect(cursorMock.continue).toHaveBeenCalled();
        requestMock.result = null;
        if (requestMock.onsuccess)
            requestMock.onsuccess();
        await promise;
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`);
        vi.unstubAllGlobals();
    });
    it("should count bookings for an account", async () => {
        requestMock.result = [{}, {}];
        const promise = repository.countByAccount(123);
        requestMock.onsuccess();
        const result = await promise;
        expect(result).toBe(2);
    });
});
