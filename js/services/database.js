import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
import { IndexedDbBase } from "./database/base";
import { DatabaseMigrator } from "./database/migrator";
import { AccountRepository, BookingRepository, BookingTypeRepository, StockRepository } from "./database/repositories/repositories";
const VALID_STORE_NAMES = [
    INDEXED_DB.STORE.ACCOUNTS.NAME,
    INDEXED_DB.STORE.BOOKINGS.NAME,
    INDEXED_DB.STORE.STOCKS.NAME,
    INDEXED_DB.STORE.BOOKING_TYPES.NAME
];
export class DatabaseService extends IndexedDbBase {
    accounts = new AccountRepository(this);
    bookings = new BookingRepository(this);
    bookingTypes = new BookingTypeRepository(this);
    stocks = new StockRepository(this);
    migrator = new DatabaseMigrator();
    constructor() {
        super();
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
        if (this.db)
            return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB.NAME, INDEXED_DB.CURRENT_VERSION);
            request.onerror = () => {
                this.handleConnectionError();
                reject(new AppError(ERROR_CODES.SERVICES.DATABASE.A, ERROR_CATEGORY.DATABASE, false));
            };
            request.onsuccess = () => {
                this.handleConnectionSuccess(request.result);
                resolve();
            };
            request.onupgradeneeded = (ev) => {
                this.migrator.setupDatabase(request.result, ev);
            };
        });
    }
    async disconnect() {
        if (this.db) {
            try {
                this.db.close();
            }
            catch (err) {
                DomainUtils.log("SERVICES database", err, "error");
            }
            finally {
                this.resetConnection();
            }
        }
    }
    async atomicImport(stores) {
        this.validateStoreNames(stores.map(s => s.storeName));
        return this.withTransaction(stores.map((s) => s.storeName), "readwrite", async (tx) => {
            for (const { storeName, operations } of stores) {
                await this.executeOperations(tx.objectStore(storeName), operations);
            }
        });
    }
    async batchOperations(storeName, operations) {
        return this.withTransaction(storeName, "readwrite", async (tx) => {
            await this.executeOperations(tx.objectStore(storeName), operations);
        });
    }
    async getAccountRecords(accountId) {
        DomainUtils.log("SERVICES database: getAccountRecords");
        return this.withTransaction([
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME,
            INDEXED_DB.STORE.ACCOUNTS.NAME
        ], "readonly", async (tx) => {
            const [accounts, bookings, bookingTypes, stocks] = await Promise.all([
                this.accounts.getAll(tx),
                this.bookings.getAllByAccount(accountId, tx),
                this.bookingTypes.getAllByAccount(accountId, tx),
                this.stocks.getAllByAccount(accountId, tx)
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
        return this.withTransaction([
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            INDEXED_DB.STORE.STOCKS.NAME,
            INDEXED_DB.STORE.ACCOUNTS.NAME
        ], "readwrite", async (tx) => {
            await Promise.all([
                this.bookings.deleteByAccount(accountId, tx),
                this.bookingTypes.deleteByAccount(accountId, tx),
                this.stocks.deleteByAccount(accountId, tx)
            ]);
            await this.accounts.delete(accountId, tx);
        });
    }
    async healthCheck() {
        return this.withTransaction([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.STOCKS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME
        ], "readonly", async (tx) => {
            const accounts = await this.accounts.getAll(tx);
            const accountIds = new Set(accounts.map((a) => a.cID));
            const [bookings, stocks, bookingTypes] = await Promise.all([
                this.getAll(INDEXED_DB.STORE.BOOKINGS.NAME, tx),
                this.getAll(INDEXED_DB.STORE.STOCKS.NAME, tx),
                this.getAll(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx)
            ]);
            return {
                orphanedBookings: this.countOrphaned(bookings, accountIds, "cAccountNumberID"),
                orphanedStocks: this.countOrphaned(stocks, accountIds, "cAccountNumberID"),
                orphanedBookingTypes: this.countOrphaned(bookingTypes, accountIds, "cAccountNumberID")
            };
        });
    }
    async repairDatabase() {
        await this.withTransaction([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.STOCKS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME
        ], "readwrite", async (tx) => {
            const accounts = await this.accounts.getAll(tx);
            const accountIds = new Set(accounts.map((a) => a.cID));
            await Promise.all([
                this.removeOrphaned(tx, INDEXED_DB.STORE.BOOKINGS.NAME, accountIds, "cAccountNumberID"),
                this.removeOrphaned(tx, INDEXED_DB.STORE.STOCKS.NAME, accountIds, "cAccountNumberID"),
                this.removeOrphaned(tx, INDEXED_DB.STORE.BOOKING_TYPES.NAME, accountIds, "cAccountNumberID")
            ]);
        });
    }
    handleConnectionSuccess(db) {
        this.db = db;
        this.connected = true;
        this.setupEventHandlers();
    }
    handleConnectionError() {
        this.resetConnection();
    }
    resetConnection() {
        this.db = null;
        this.connected = false;
    }
    validateStoreNames(storeNames) {
        const invalidStores = storeNames.filter(name => !VALID_STORE_NAMES.includes(name));
        if (invalidStores.length > 0) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false);
        }
    }
    async executeOperations(store, operations) {
        for (const op of operations) {
            this.executeOperation(store, op);
        }
    }
    executeOperation(store, op) {
        switch (op.type) {
            case "add":
                store.add(op.data);
                break;
            case "put":
                store.put(op.data);
                break;
            case "delete":
                if (!op.key) {
                    throw new AppError(ERROR_CODES.SERVICES.DATABASE.C, ERROR_CATEGORY.DATABASE, false);
                }
                store.delete(op.key);
                break;
            case "clear":
                store.clear();
                break;
            default:
                throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false);
        }
    }
    countOrphaned(records, validIds, foreignKeyField) {
        return records.filter((r) => !validIds.has(r[foreignKeyField])).length;
    }
    async removeOrphaned(tx, storeName, validIds, foreignKeyField) {
        const records = await this.getAll(storeName, tx);
        const store = tx.objectStore(storeName);
        for (const record of records) {
            if (!validIds.has(record[foreignKeyField])) {
                store.delete(record.cID);
            }
        }
    }
    setupEventHandlers() {
        if (!this.db)
            return;
        this.db.onversionchange = () => {
            this.db.close();
            this.resetConnection();
            window.location.reload();
        };
        this.db.onclose = () => {
            this.resetConnection();
        };
    }
}
export const databaseService = new DatabaseService();
DomainUtils.log("SERVICES database");
