import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
import { DatabaseConnectionManager } from "./connection/manager";
import { TransactionManager } from "./transaction/manager";
import { DatabaseMigrator } from "./migrator";
import { RepositoryFactory } from "./repositories/factory";
import { DatabaseHealthService } from "./health/service";
import { BatchOperationService } from "./batch/service";
export class Service {
    connection;
    transactionManager;
    repositoryFactory;
    healthService;
    batchService;
    constructor(dbName = INDEXED_DB.NAME, version = INDEXED_DB.CURRENT_VERSION) {
        const migrator = new DatabaseMigrator();
        this.connection = new DatabaseConnectionManager(dbName, version, migrator);
        this.transactionManager = new TransactionManager(this.connection);
        this.repositoryFactory = new RepositoryFactory(this.transactionManager);
        this.healthService = new DatabaseHealthService(this.repositoryFactory, this.transactionManager);
        this.batchService = new BatchOperationService(this.transactionManager);
    }
    getTransactionManager() {
        return this.transactionManager;
    }
    async connect() {
        return this.connection.connect();
    }
    async disconnect() {
        return this.connection.disconnect();
    }
    isConnected() {
        return this.connection.isConnected();
    }
    onVersionChange(handler) {
        this.connection.onVersionChange(handler);
    }
    getRepository(type) {
        return this.repositoryFactory.getRepository(type);
    }
    getAllRepositories() {
        return this.repositoryFactory.getAllRepositories();
    }
    async getAccountRecords(accountId) {
        DomainUtils.log("DATABASE service: fetching account records", {
            accountId
        });
        const repos = this.getAllRepositories();
        return this.transactionManager.execute([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME
        ], "readonly", async (tx) => {
            const [accounts, bookings, bookingTypes, stocks] = await Promise.all([
                repos.accounts.findAll({ tx }),
                repos.bookings.findByAccount(accountId, { tx }),
                repos.bookingTypes.findByAccount(accountId, { tx }),
                repos.stocks.findByAccount(accountId, { tx })
            ]);
            return {
                accountsDB: accounts,
                bookingsDB: bookings,
                bookingTypesDB: bookingTypes,
                stocksDB: stocks
            };
        });
    }
    async deleteAccountRecords(accountId) {
        DomainUtils.log("DATABASE service: deleting account records", {
            accountId
        });
        const repos = this.getAllRepositories();
        return this.transactionManager.execute([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME
        ], "readwrite", async (tx) => {
            await Promise.all([
                repos.bookings.deleteByAccount(accountId, { tx }),
                repos.bookingTypes.deleteByAccount(accountId, { tx }),
                repos.stocks.deleteByAccount(accountId, { tx })
            ]);
            await repos.accounts.delete(accountId, { tx });
        });
    }
    async atomicImport(descriptors) {
        return this.batchService.executeAtomic(descriptors);
    }
    async batchOperations(storeName, operations) {
        return this.batchService.executeBatch(storeName, operations);
    }
    batch() {
        return this.batchService.createBuilder();
    }
    async healthCheck() {
        return this.healthService.performHealthCheck();
    }
    async repairDatabase() {
        return this.healthService.repairDatabase();
    }
}
export function createDatabaseService(dbName, version) {
    return new Service(dbName, version);
}
export let databaseService = createDatabaseService();
export function setDatabaseService(service) {
    databaseService = service;
}
DomainUtils.log("SERVICES database (refactored)");
