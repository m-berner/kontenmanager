/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ValidStoreNameType} from "@/domain/constants";
import {INDEXED_DB} from "@/domain/constants";
import type {
    BatchOperationDescriptor,
    HealthCheckResult,
    RecordOperation,
    RecordsDbData,
    RepairResult,
    RepositoryMap,
    RepositoryType
} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {createBatchOperationService} from "./batchOperations";
import {createDatabaseConnectionManager} from "./connectionManager";
import {createDatabaseHealthService} from "./healthChecker";
import {setupDatabase} from "./migrator";
import {createRepositoryFactory} from "./repositories/repositoryFactory";
import {createTransactionManager} from "./transactionManager";

export type {RepositoryMap, RepositoryType} from "@/domain/types";

/**
 * Main database service instance creator.
 */
export function createDatabaseAdapter(
    dbName: string = INDEXED_DB.NAME,
    version: number = INDEXED_DB.CURRENT_VERSION
) {
    const migrator = {setupDatabase};
    const connection = createDatabaseConnectionManager(dbName, version, migrator);
    const transactionManager = createTransactionManager(connection);

    const repositoryFactory = createRepositoryFactory(transactionManager);
    const healthService = createDatabaseHealthService(
        repositoryFactory,
        transactionManager
    );
    const batchService = createBatchOperationService(transactionManager);

    /**
     * Returns the transaction manager
     */
    function getTransactionManager() {
        return transactionManager;
    }

    /**
     * Connects to the database
     */
    async function connect(): Promise<void> {
        return connection.connect();
    }

    /**
     * Disconnects from the database
     */
    async function disconnect(): Promise<void> {
        return connection.disconnect();
    }

    /**
     * Checks if the database is connected
     */
    function isConnected(): boolean {
        return connection.isConnected();
    }

    /**
     * Registers a handler for version changes
     */
    function onVersionChange(handler: () => void): void {
        connection.onVersionChange(handler);
    }

    /**
     * Gets a repository by type
     */
    function getRepository<T extends RepositoryType>(type: T): RepositoryMap[T] {
        return repositoryFactory.getRepository(type);
    }

    /**
     * Gets all repositories
     */
    function getAllRepositories(): RepositoryMap {
        return repositoryFactory.getAllRepositories();
    }

    /**
     * Retrieves all records for a specific account
     */
    async function getAccountRecords(accountId: number): Promise<RecordsDbData> {
        log("DATABASE service: fetching account records", {
            accountId
        });

        const repos = getAllRepositories();

        return transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME
            ],
            "readonly",
            async (tx: IDBTransaction) => {
                const [accounts, bookings, bookingTypes, stocks] = await Promise.all([
                    repos.accounts.findAll({tx}),
                    repos.bookings.findByAccount(accountId, {tx}),
                    repos.bookingTypes.findByAccount(accountId, {tx}),
                    repos.stocks.findByAccount(accountId, {tx})
                ]);

                return {
                    accountsDB: accounts,
                    bookingsDB: bookings,
                    bookingTypesDB: bookingTypes,
                    stocksDB: stocks
                };
            }
        );
    }

    /**
     * Deletes all records associated with an account
     */
    async function deleteAccountRecords(accountId: number): Promise<void> {
        log("DATABASE service: deleting account records", {
            accountId
        });

        const repos = getAllRepositories();

        return transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME
            ],
            "readwrite",
            async (tx: IDBTransaction) => {
                // Delete dependent records first (foreign key constraints)
                await Promise.all([
                    repos.bookings.deleteByAccount(accountId, {tx}),
                    repos.bookingTypes.deleteByAccount(accountId, {tx}),
                    repos.stocks.deleteByAccount(accountId, {tx})
                ]);

                // Then delete the account itself
                await repos.accounts.delete(accountId, {tx});
            }
        );
    }

    /**
     * Executes multiple operations atomically across stores
     */
    async function atomicImport(descriptors: BatchOperationDescriptor[]): Promise<void> {
        return batchService.executeAtomic(descriptors);
    }

    /**
     * Executes operations on a single store
     */
    async function batchOperations(
        storeName: ValidStoreNameType,
        operations: RecordOperation[]
    ): Promise<void> {
        return batchService.executeBatch(storeName, operations);
    }

    /**
     * Creates a fluent batch operation builder
     */
    function batch() {
        return batchService.createBuilder();
    }

    /**
     * Performs a health check on the database
     */
    async function healthCheck(): Promise<HealthCheckResult> {
        return healthService.performHealthCheck();
    }

    /**
     * Repairs the database by fixing detected issues
     */
    async function repairDatabase(): Promise<RepairResult> {
        return healthService.repairDatabase();
    }

    return {
        transactionManager,
        getTransactionManager,
        connect,
        disconnect,
        isConnected,
        onVersionChange,
        getRepository,
        getAllRepositories,
        getAccountRecords,
        deleteAccountRecords,
        atomicImport,
        batchOperations,
        batch,
        healthCheck,
        repairDatabase
    };
}

export type Service = ReturnType<typeof createDatabaseAdapter>;