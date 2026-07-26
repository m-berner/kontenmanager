/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createDatabaseAdapter} from "@/adapters/driven/database/databaseAdapter";
import {INDEXED_DB} from "@/domain/constants";

const mocks = vi.hoisted(() => {
    const mockConnection = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: vi.fn(),
        getDatabase: vi.fn(),
        onVersionChange: vi.fn()
    };
    const mockTransactionManager = {
        execute: vi.fn(),
        executeMultiple: vi.fn()
    };
    const mockRepos = {
        accounts: {findAll: vi.fn(), delete: vi.fn()},
        bookings: {findByAccount: vi.fn(), deleteByAccount: vi.fn()},
        bookingTypes: {findByAccount: vi.fn(), deleteByAccount: vi.fn()},
        stocks: {findByAccount: vi.fn(), deleteByAccount: vi.fn()}
    };
    const mockRepositoryFactory = {
        getRepository: vi.fn(),
        getAllRepositories: vi.fn(() => mockRepos),
        clearCache: vi.fn()
    };
    const mockHealthService = {
        performHealthCheck: vi.fn(),
        repairDatabase: vi.fn()
    };
    const mockBatchService = {
        executeAtomic: vi.fn(),
        executeBatch: vi.fn(),
        createBuilder: vi.fn()
    };

    return {
        mockConnection,
        mockTransactionManager,
        mockRepos,
        mockRepositoryFactory,
        mockHealthService,
        mockBatchService,
        mockCreateDatabaseConnectionManager: vi.fn(() => mockConnection),
        mockCreateTransactionManager: vi.fn(() => mockTransactionManager),
        mockCreateRepositoryFactory: vi.fn(() => mockRepositoryFactory),
        mockCreateDatabaseHealthService: vi.fn(() => mockHealthService),
        mockCreateBatchOperationService: vi.fn(() => mockBatchService)
    };
});

vi.mock("@/adapters/driven/database/connectionManager", () => ({
    createDatabaseConnectionManager: mocks.mockCreateDatabaseConnectionManager
}));
vi.mock("@/adapters/driven/database/transactionManager", () => ({
    createTransactionManager: mocks.mockCreateTransactionManager
}));
vi.mock("@/adapters/driven/database/repositories/repositoryFactory", () => ({
    createRepositoryFactory: mocks.mockCreateRepositoryFactory
}));
vi.mock("@/adapters/driven/database/healthChecker", () => ({
    createDatabaseHealthService: mocks.mockCreateDatabaseHealthService
}));
vi.mock("@/adapters/driven/database/batchOperations", () => ({
    createBatchOperationService: mocks.mockCreateBatchOperationService
}));
vi.mock("@/adapters/driven/database/migrator", () => ({
    setupDatabase: vi.fn()
}));

const {
    mockConnection,
    mockTransactionManager,
    mockRepos,
    mockRepositoryFactory,
    mockHealthService,
    mockBatchService,
    mockCreateDatabaseConnectionManager
} = mocks;

const ALL_STORES = [
    INDEXED_DB.STORE.ACCOUNTS.NAME,
    INDEXED_DB.STORE.BOOKINGS.NAME,
    INDEXED_DB.STORE.BOOKING_TYPES.NAME,
    INDEXED_DB.STORE.STOCKS.NAME
];

describe("databaseAdapter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTransactionManager.execute.mockImplementation(
            (_stores: unknown, _mode: unknown, operation: (_tx: unknown) => unknown) => operation({})
        );
        mockRepositoryFactory.getAllRepositories.mockReturnValue(mockRepos);
        mockRepos.accounts.findAll.mockResolvedValue([{cID: 1}]);
        mockRepos.bookings.findByAccount.mockResolvedValue([{cID: 10}]);
        mockRepos.bookingTypes.findByAccount.mockResolvedValue([{cID: 20}]);
        mockRepos.stocks.findByAccount.mockResolvedValue([{cID: 30}]);
        mockRepos.bookings.deleteByAccount.mockResolvedValue(undefined);
        mockRepos.bookingTypes.deleteByAccount.mockResolvedValue(undefined);
        mockRepos.stocks.deleteByAccount.mockResolvedValue(undefined);
        mockRepos.accounts.delete.mockResolvedValue(undefined);
    });

    it("wires the connection manager with the given dbName/version and a migrator delegate", () => {
        createDatabaseAdapter("myDb", 5);

        expect(mockCreateDatabaseConnectionManager).toHaveBeenCalledWith(
            "myDb",
            5,
            expect.objectContaining({setupDatabase: expect.any(Function)})
        );
    });

    it("delegates connect/disconnect/isConnected/onVersionChange to the connection manager", async () => {
        const adapter = createDatabaseAdapter();
        const handler = vi.fn();

        await adapter.connect();
        await adapter.disconnect();
        adapter.isConnected();
        adapter.onVersionChange(handler);

        expect(mockConnection.connect).toHaveBeenCalled();
        expect(mockConnection.disconnect).toHaveBeenCalled();
        expect(mockConnection.isConnected).toHaveBeenCalled();
        expect(mockConnection.onVersionChange).toHaveBeenCalledWith(handler);
    });

    it("getRepository/getAllRepositories delegate to the repository factory", () => {
        const adapter = createDatabaseAdapter();

        adapter.getRepository("accounts");
        adapter.getAllRepositories();

        expect(mockRepositoryFactory.getRepository).toHaveBeenCalledWith("accounts");
        expect(mockRepositoryFactory.getAllRepositories).toHaveBeenCalled();
    });

    it("getAccountRecords reads all four stores in one readonly transaction and shapes the result", async () => {
        const adapter = createDatabaseAdapter();

        const result = await adapter.getAccountRecords(42);

        expect(mockTransactionManager.execute).toHaveBeenCalledWith(
            ALL_STORES,
            "readonly",
            expect.any(Function)
        );
        expect(mockRepos.bookings.findByAccount).toHaveBeenCalledWith(42, {tx: {}});
        expect(mockRepos.bookingTypes.findByAccount).toHaveBeenCalledWith(42, {tx: {}});
        expect(mockRepos.stocks.findByAccount).toHaveBeenCalledWith(42, {tx: {}});
        expect(result).toEqual({
            accountsDB: [{cID: 1}],
            bookingsDB: [{cID: 10}],
            bookingTypesDB: [{cID: 20}],
            stocksDB: [{cID: 30}]
        });
    });

    it("deleteAccountRecords deletes dependent records before the account itself, in one readwrite transaction", async () => {
        const adapter = createDatabaseAdapter();
        const callOrder: string[] = [];
        mockRepos.bookings.deleteByAccount.mockImplementation(async () => {
            callOrder.push("bookings");
        });
        mockRepos.bookingTypes.deleteByAccount.mockImplementation(async () => {
            callOrder.push("bookingTypes");
        });
        mockRepos.stocks.deleteByAccount.mockImplementation(async () => {
            callOrder.push("stocks");
        });
        mockRepos.accounts.delete.mockImplementation(async () => {
            callOrder.push("account");
        });

        await adapter.deleteAccountRecords(42);

        expect(mockTransactionManager.execute).toHaveBeenCalledWith(
            ALL_STORES,
            "readwrite",
            expect.any(Function)
        );
        expect(callOrder.indexOf("account")).toBe(callOrder.length - 1);
        expect(callOrder).toContain("bookings");
        expect(callOrder).toContain("bookingTypes");
        expect(callOrder).toContain("stocks");
    });

    it("atomicImport/batchOperations/batch delegate to the batch service", () => {
        const adapter = createDatabaseAdapter();
        const descriptors = [{store: "accounts", op: "add"}] as any;
        const operations = [{type: "add"}] as any;

        adapter.atomicImport(descriptors);
        adapter.batchOperations("accounts" as any, operations);
        adapter.batch();

        expect(mockBatchService.executeAtomic).toHaveBeenCalledWith(descriptors);
        expect(mockBatchService.executeBatch).toHaveBeenCalledWith("accounts", operations);
        expect(mockBatchService.createBuilder).toHaveBeenCalled();
    });

    it("healthCheck/repairDatabase delegate to the health service", async () => {
        const adapter = createDatabaseAdapter();

        await adapter.healthCheck();
        await adapter.repairDatabase();

        expect(mockHealthService.performHealthCheck).toHaveBeenCalled();
        expect(mockHealthService.repairDatabase).toHaveBeenCalled();
    });

    it("getTransactionManager returns the same transaction manager instance used internally", () => {
        const adapter = createDatabaseAdapter();
        expect(adapter.getTransactionManager()).toBe(mockTransactionManager);
    });
});