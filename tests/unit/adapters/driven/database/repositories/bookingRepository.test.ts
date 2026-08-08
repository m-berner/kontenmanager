/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createBookingRepository} from "@/adapters/driven/database/repositories/bookingRepository";
import {INDEXED_DB} from "@/domain/constants";

describe("BookingRepository", () => {
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

        repository = createBookingRepository(transactionManagerMock);
    });

    it("should find bookings by account", async () => {
        const bookings = [{cID: 1, cAccountNumberID: 123}];
        requestMock.result = bookings;

        const promise = repository.findByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(bookings);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`);
        expect(indexMock.getAll).toHaveBeenCalledWith(123);
    });

    it("should find bookings by date", async () => {
        const bookings = [{cID: 1, cBookDate: "2026-02-01"}];
        requestMock.result = bookings;

        const promise = repository.findByDate("2026-02-01");
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(bookings);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`);
        expect(indexMock.getAll).toHaveBeenCalledWith("2026-02-01");
    });

    it("should delete bookings by account", async () => {
        // Mock IDBKeyRange
        vi.stubGlobal("IDBKeyRange", {
            only: vi.fn().mockImplementation((val) => `range-${val}`)
        });

        // Mock for deleteByCursor. `cursor.delete()` returns an IDBRequest and
        // the cursor advances from that request's own onsuccess — see
        // baseRepository's deleteBy test.
        const deleteRequestMock: { onsuccess: (() => void) | null; onerror: (() => void) | null } = {
            onsuccess: null,
            onerror: null
        };
        const cursorMock = {
            delete: vi.fn(() => deleteRequestMock),
            continue: vi.fn()
        };

        // The first call to openCursor returns a cursor, second returns null (end)
        const promise = repository.deleteByAccount(123);

        // Trigger onsuccess for openCursor
        requestMock.result = cursorMock;
        if (requestMock.onsuccess) requestMock.onsuccess();

        expect(cursorMock.delete).toHaveBeenCalled();
        deleteRequestMock.onsuccess?.();
        expect(cursorMock.continue).toHaveBeenCalled();

        // End of cursor
        requestMock.result = null;
        if (requestMock.onsuccess) requestMock.onsuccess();

        await promise;
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`);

        vi.unstubAllGlobals();
    });

    // Counts through IDBIndex.count(key) — the mock resolves a number, not an
    // array. This is the repository where it matters most: an account's booking
    // history is the largest collection in the database, and the old
    // findByAccount().length form deserialized all of it per call.
    it("should count bookings for an account without materializing the rows", async () => {
        requestMock.result = 2;

        const promise = repository.countByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toBe(2);
        expect(indexMock.count).toHaveBeenCalledWith(123);
        expect(indexMock.getAll).not.toHaveBeenCalled();
    });
});
