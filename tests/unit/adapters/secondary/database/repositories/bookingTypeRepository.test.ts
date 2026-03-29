/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {BookingTypeRepository} from "@/adapters/secondary/database/repositories/bookingTypeRepository";
import {INDEXED_DB} from "@/domain/constants";

describe("BookingTypeRepository", () => {
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
            getAll: vi.fn().mockReturnValue(requestMock)
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

        repository = BookingTypeRepository.create(transactionManagerMock);
    });

    it("should find booking types by account", async () => {
        const bookingTypes = [{cID: 1, cAccountNumberID: 123}];
        requestMock.result = bookingTypes;

        const promise = repository.findByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(bookingTypes);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`);
        expect(indexMock.getAll).toHaveBeenCalledWith(123);
    });

    it("should count booking types for an account", async () => {
        requestMock.result = [{cID: 1}, {cID: 2}];

        const promise = repository.countByAccount(123);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toBe(2);
    });
});
