/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createBatchOperationService} from "@/services/database/batch/service";
import {INDEXED_DB} from "@/constants";

describe("BatchOperationService", () => {
    let service: any;
    let transactionManagerMock: any;
    let txMock: any;
    let storeMock: any;

    beforeEach(() => {
        storeMock = {
            add: vi.fn().mockImplementation(() => {
                const req = {onsuccess: null, onerror: null, result: null} as any;
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
            }),
            put: vi.fn().mockImplementation(() => {
                const req = {onsuccess: null, onerror: null, result: null} as any;
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
            }),
            delete: vi.fn().mockImplementation(() => {
                const req = {onsuccess: null, onerror: null, result: null} as any;
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
            }),
            clear: vi.fn().mockImplementation(() => {
                const req = {onsuccess: null, onerror: null, result: null} as any;
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
            })
        };

        txMock = {
            objectStore: vi.fn().mockReturnValue(storeMock)
        };

        transactionManagerMock = {
            execute: vi.fn().mockImplementation(async (_stores, _mode, operation) => {
                return operation(txMock);
            })
        };

        service = createBatchOperationService(transactionManagerMock);
    });

    describe("executeAtomic", () => {
        it("should execute multiple operations in a single transaction", async () => {
            const descriptors = [
                {
                    storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                    operations: [
                        {type: "add", data: {id: 1, name: "Account 1"}},
                        {type: "put", data: {id: 2, name: "Account 2"}}
                    ]
                } as any
            ];

            await service.executeAtomic(descriptors);

            expect(transactionManagerMock.execute).toHaveBeenCalled();
            expect(storeMock.add).toHaveBeenCalledWith({id: 1, name: "Account 1"});
            expect(storeMock.put).toHaveBeenCalledWith({id: 2, name: "Account 2"});
        });

        it("should throw an error if no operation is provided", async () => {
            await expect(service.executeAtomic([])).rejects.toThrow();
        });

        it("should throw an error for an invalid store name", async () => {
            const descriptors = [{storeName: "INVALID_STORE", operations: [{type: "add", data: {}}]} as any];
            await expect(service.executeAtomic(descriptors)).rejects.toThrow();
        });
    });

    describe("BatchOperationBuilder", () => {
        it("should build and execute a batch of operations", async () => {
            const builder = service.createBuilder();
            const account = {id: 1, name: "Test"};
            
            builder
                .insert(INDEXED_DB.STORE.ACCOUNTS.NAME, account)
                .remove(INDEXED_DB.STORE.BOOKINGS.NAME, 123)
                .clear(INDEXED_DB.STORE.STOCKS.NAME);

            expect(builder.getOperationCount()).toBe(3);

            await builder.execute();

            expect(storeMock.add).toHaveBeenCalledWith(account);
            expect(storeMock.delete).toHaveBeenCalledWith(123);
            expect(storeMock.clear).toHaveBeenCalled();
        });

        it("should reset operations", () => {
            const builder = service.createBuilder();
            builder.insert(INDEXED_DB.STORE.ACCOUNTS.NAME, {});
            expect(builder.getOperationCount()).toBe(1);
            
            builder.reset();
            expect(builder.getOperationCount()).toBe(0);
        });
    });
});
