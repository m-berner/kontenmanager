import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
import { IndexedDbBase } from "./database/base";
import { DatabaseMigrator } from "./database/migrator";
import { AccountRepository } from "./database/repositories/AccountRepository";
import { BookingRepository } from "./database/repositories/BookingRepository";
import { BookingTypeRepository } from "./database/repositories/BookingTypeRepository";
import { StockRepository } from "./database/repositories/StockRepository";
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
                this.db = null;
                this.connected = false;
                reject(new AppError(ERROR_CODES.SERVICES.DATABASE.A, ERROR_CATEGORY.DATABASE, false));
            };
            request.onsuccess = () => {
                this.db = request.result;
                this.connected = true;
                this.setupEventHandlers();
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
                this.db = null;
                this.connected = false;
            }
        }
    }
    async atomicImport(stores) {
        stores.forEach((store) => {
            if (![
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME
            ].includes(store.storeName)) {
                throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false);
            }
        });
        return this.withTransaction(stores.map((s) => s.storeName), "readwrite", async (tx) => {
            for (const { storeName, operations } of stores) {
                const store = tx.objectStore(storeName);
                for (const op of operations) {
                    switch (op.type) {
                        case "add":
                            store.add(op.data);
                            break;
                        case "put":
                            store.put(op.data);
                            break;
                        case "delete":
                            if (!op.key)
                                throw new AppError(ERROR_CODES.SERVICES.DATABASE.C, ERROR_CATEGORY.DATABASE, false);
                            store.delete(op.key);
                            break;
                        case "clear":
                            store.clear();
                            break;
                        default:
                            throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false);
                    }
                }
            }
        });
    }
    async batchOperations(storeName, operations) {
        return this.withTransaction(storeName, "readwrite", async (tx) => {
            const store = tx.objectStore(storeName);
            for (const op of operations) {
                switch (op.type) {
                    case "add":
                        store.add(op.data);
                        break;
                    case "put":
                        store.put(op.data);
                        break;
                    case "delete":
                        if (!op.key)
                            throw new AppError(ERROR_CODES.SERVICES.DATABASE.E, ERROR_CATEGORY.DATABASE, false);
                        store.delete(op.key);
                        break;
                    case "clear":
                        store.clear();
                        break;
                    default:
                        throw new AppError(ERROR_CODES.SERVICES.DATABASE.F, ERROR_CATEGORY.DATABASE, false);
                }
            }
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
            const bookings = await this.getAll(INDEXED_DB.STORE.BOOKINGS.NAME, tx);
            const stocks = await this.getAll(INDEXED_DB.STORE.STOCKS.NAME, tx);
            const bookingTypes = await this.getAll(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx);
            const orphanedBookings = bookings.filter((b) => !accountIds.has(b.cAccountNumberID)).length;
            const orphanedStocks = stocks.filter((s) => !accountIds.has(s.cAccountNumberID)).length;
            const orphanedBookingTypes = bookingTypes.filter((bt) => !accountIds.has(bt.cAccountNumberID)).length;
            return { orphanedBookings, orphanedStocks, orphanedBookingTypes };
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
            const bookings = await this.getAll(INDEXED_DB.STORE.BOOKINGS.NAME, tx);
            for (const b of bookings) {
                if (!accountIds.has(b.cAccountNumberID)) {
                    tx.objectStore(INDEXED_DB.STORE.BOOKINGS.NAME).delete(b.cID);
                }
            }
            const stocks = await this.getAll(INDEXED_DB.STORE.STOCKS.NAME, tx);
            for (const s of stocks) {
                if (!accountIds.has(s.cAccountNumberID)) {
                    tx.objectStore(INDEXED_DB.STORE.STOCKS.NAME).delete(s.cID);
                }
            }
            const bookingTypes = await this.getAll(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx);
            for (const bt of bookingTypes) {
                if (!accountIds.has(bt.cAccountNumberID)) {
                    tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME).delete(bt.cID);
                }
            }
        });
    }
    setupEventHandlers() {
        if (!this.db)
            return;
        this.db.onversionchange = () => {
            this.db.close();
            this.db = null;
            this.connected = false;
            window.location.reload();
        };
        this.db.onclose = () => {
            this.connected = false;
            this.db = null;
        };
    }
}
export const databaseService = new DatabaseService();
DomainUtils.log("SERVICES database");
