/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createBatchOperationService} from "@/adapters/secondary/database/batch/service";
import {INDEXED_DB} from "@/domain/constants";
import type {BatchOperationDescriptor} from "@/domain/types";
import type {TransactionManagerContract} from "@/adapters/secondary/database/transaction/manager";

describe("BatchOperationService", () => {
    let service: ReturnType<typeof createBatchOperationService>;
    let transactionManagerMock: TransactionManagerContract;
    let txMock: Pick<IDBTransaction, "objectStore">;
    let storeMock: Pick<IDBObjectStore, "add" | "put" | "delete" | "clear">;

    type FakeRequest<T> = {
        // Keep the fake minimal and ergonomic for tests; the real IDBRequest
        // handlers take an Event argument, but we don't need that here.
        onsuccess: (() => void) | null;
        onerror: (() => void) | null;
        result: T;
        error: IDBRequest<T>["error"];
    };

    function createRequest<T>(result: T): FakeRequest<T> {
        const req: FakeRequest<T> = {onsuccess: null, onerror: null, result, error: null};
        return req;
    }

    function asIdbRequest<T>(req: FakeRequest<T>): IDBRequest<T> {
        return req as unknown as IDBRequest<T>;
    }

    beforeEach(() => {
        storeMock = {
            add: vi.fn().mockImplementation(() => {
                const req = createRequest(null);
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return asIdbRequest(req);
            }),
            put: vi.fn().mockImplementation(() => {
                const req = createRequest(null);
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return asIdbRequest(req);
            }),
            delete: vi.fn().mockImplementation(() => {
                const req = createRequest(null);
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return asIdbRequest(req);
            }),
            clear: vi.fn().mockImplementation(() => {
                const req = createRequest(null);
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
                }, 0);
                return asIdbRequest(req);
            })
        };

        txMock = {
            objectStore: vi.fn().mockReturnValue(storeMock)
        };

        transactionManagerMock = {
            execute: vi.fn().mockImplementation(async (_stores, _mode, operation) => {
                return operation(txMock as unknown as IDBTransaction);
            }),
            executeMultiple: vi.fn()
        } as unknown as TransactionManagerContract;

        service = createBatchOperationService(transactionManagerMock);
    });

    describe("executeAtomic", () => {
        it("should execute multiple operations in a single transaction", async () => {
            const descriptors: BatchOperationDescriptor[] = [
                {
                    storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                    operations: [
                        {type: "add", data: {id: 1, name: "Account 1"}},
                        {type: "put", data: {id: 2, name: "Account 2"}}
                    ]
                }
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
            const descriptors = [
                {storeName: "INVALID_STORE", operations: [{type: "add", data: {}}]}
            ] as unknown as BatchOperationDescriptor[];
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
