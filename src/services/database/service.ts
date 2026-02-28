/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {DomainUtils} from "@/domains/utils";
import {INDEXED_DB} from "@/configs/database";
import type {
    BatchOperationDescriptor,
    HealthCheckResult,
    RecordOperation,
    RecordsDbData,
    RepairResult,
    RepositoryMap,
    RepositoryType
} from "@/types";

// Core components
import {DatabaseConnectionManager} from "./connection/manager";
import {TransactionManager} from "./transaction/manager";
import {DatabaseMigrator} from "./migrator";

// Services
import {RepositoryFactory} from "./repositories/factory";
import {DatabaseHealthService} from "./health/service";
import {BatchOperationService} from "./batch/service";

export type {RepositoryMap, RepositoryType} from "@/types";

/**
 * Main database service - Facade for all database operations
 *
 * This is the primary entry point for database interactions.
 * It orchestrates the various specialized services.
 */
export class Service {
    private readonly connection: DatabaseConnectionManager;
    public readonly transactionManager: TransactionManager;
    private readonly repositoryFactory: RepositoryFactory;
    private readonly healthService: DatabaseHealthService;
    private readonly batchService: BatchOperationService;

    constructor(
        dbName: string = INDEXED_DB.NAME,
        version: number = INDEXED_DB.CURRENT_VERSION
    ) {
        // Initialize core components
        const migrator = new DatabaseMigrator();
        this.connection = new DatabaseConnectionManager(dbName, version, migrator);
        this.transactionManager = new TransactionManager(this.connection);

        // Initialize services
        this.repositoryFactory = new RepositoryFactory(this.transactionManager);
        this.healthService = new DatabaseHealthService(
            this.repositoryFactory,
            this.transactionManager
        );
        this.batchService = new BatchOperationService(this.transactionManager);
    }

    /**
     * Returns the transaction manager
     */
    public getTransactionManager(): TransactionManager {
        return this.transactionManager;
    }

    // ========================================================================
    // Connection Management
    // ========================================================================

    /**
     * Connects to the database
     */
    async connect(): Promise<void> {
        return this.connection.connect();
    }

    /**
     * Disconnects from the database
     */
    async disconnect(): Promise<void> {
        return this.connection.disconnect();
    }

    /**
     * Checks if the database is connected
     */
    isConnected(): boolean {
        return this.connection.isConnected();
    }

    /**
     * Registers a handler for version changes
     */
    onVersionChange(handler: () => void): void {
        this.connection.onVersionChange(handler);
    }

    // ========================================================================
    // Repository Access
    // ========================================================================

    /**
     * Gets a repository by type
     *
     * @example
     * const accounts = db.getRepository('accounts');
     * const allAccounts = await accounts.findAll();
     */
    getRepository<T extends RepositoryType>(type: T): RepositoryMap[T] {
        return this.repositoryFactory.getRepository(type);
    }

    /**
     * Gets all repositories
     *
     * @example
     * const { accounts, bookings } = db.getAllRepositories();
     */
    getAllRepositories(): RepositoryMap {
        return this.repositoryFactory.getAllRepositories();
    }

    // ========================================================================
    // High-Level Data Operations
    // ========================================================================

    /**
     * Retrieves all records for a specific account
     *
     * @param accountId - Account identifier
     * @returns Complete set of account records
     */
    async getAccountRecords(accountId: number): Promise<RecordsDbData> {
        DomainUtils.log("DATABASE service: fetching account records", {
            accountId
        });

        const repos = this.getAllRepositories();

        return this.transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME
            ],
            "readonly",
            async (tx) => {
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
     *
     * @param accountId - Account identifier
     */
    async deleteAccountRecords(accountId: number): Promise<void> {
        DomainUtils.log("DATABASE service: deleting account records", {
            accountId
        });

        const repos = this.getAllRepositories();

        return this.transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME
            ],
            "readwrite",
            async (tx) => {
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

    // ========================================================================
    // Batch Operations
    // ========================================================================

    /**
     * Executes multiple operations atomically across stores
     *
     * @param descriptors - Array of store operations
     *
     * @example
     * await db.atomicImport([
     *   { storeName: 'accounts', operations: [{ type: 'add', data: account }] },
     *   { storeName: 'bookings', operations: [{ type: 'add', data: booking }] }
     * ]);
     */
    async atomicImport(descriptors: BatchOperationDescriptor[]): Promise<void> {
        return this.batchService.executeAtomic(descriptors);
    }

    /**
     * Executes operations on a single store
     *
     * @param storeName - Target store name
     * @param operations - Operations to execute
     */
    async batchOperations(
        storeName: string,
        operations: RecordOperation[]
    ): Promise<void> {
        return this.batchService.executeBatch(storeName, operations);
    }

    /**
     * Creates a fluent batch operation builder
     *
     * @example
     * await db.batch()
     *   .insert('accounts', accountData)
     *   .insert('bookings', bookingData)
     *   .update('stocks', stockData)
     *   .execute();
     */
    batch() {
        return this.batchService.createBuilder();
    }

    // ========================================================================
    // Health & Maintenance
    // ========================================================================

    /**
     * Performs a health check on the database
     *
     * @returns Health check result with issues and statistics
     */
    async healthCheck(): Promise<HealthCheckResult> {
        return this.healthService.performHealthCheck();
    }

    /**
     * Repairs the database by fixing detected issues
     *
     * @returns Repair result with count of fixes and errors
     */
    async repairDatabase(): Promise<RepairResult> {
        return this.healthService.repairDatabase();
    }
}

/**
 * Factory function to create a database service instance
 * Use this instead of direct instantiation for better testability
 */
export function createDatabaseService(
    dbName?: string,
    version?: number
): Service {
    return new Service(dbName, version);
}

/**
 * Default singleton instance for convenience
 * Can be replaced in tests
 */
export let databaseService = createDatabaseService();

/**
 * Allows replacing the default instance (useful for testing)
 */
export function setDatabaseService(service: Service): void {
    databaseService = service;
}

DomainUtils.log("SERVICES database (refactored)");
