import { INDEXED_DB } from "@/configs/database";
import { DomainUtils } from "@/domains/utils";
export class DatabaseMigrator {
    setupDatabase(db, ev) {
        const oldVersion = ev.oldVersion;
        const newVersion = ev.newVersion || INDEXED_DB.VERSION;
        DomainUtils.log(`SERVICES DATABASE migrator: upgrade: ${oldVersion} -> ${newVersion}`, "info");
        if (oldVersion < 1) {
            this.createStores(db);
        }
        this.runMigrations(db, oldVersion, newVersion);
    }
    createStores(db) {
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.ACCOUNTS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.ACCOUNTS.NAME, {
                keyPath: INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`, INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN, { unique: true });
        }
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKINGS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.BOOKINGS.NAME, {
                keyPath: INDEXED_DB.STORE.BOOKINGS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`, INDEXED_DB.STORE.BOOKINGS.FIELDS.DATE, { unique: false });
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`, INDEXED_DB.STORE.BOOKINGS.FIELDS.BOOKING_TYPE_ID, { unique: false });
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`, INDEXED_DB.STORE.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`, INDEXED_DB.STORE.BOOKINGS.FIELDS.STOCK_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKING_TYPES.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME, {
                keyPath: INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`, INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.STOCKS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.STOCKS.NAME, {
                keyPath: INDEXED_DB.STORE.STOCKS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_uk1`, INDEXED_DB.STORE.STOCKS.FIELDS.ISIN, { unique: true });
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_uk2`, INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL, { unique: true });
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k1`, INDEXED_DB.STORE.STOCKS.FIELDS.FADE_OUT, { unique: false });
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k2`, INDEXED_DB.STORE.STOCKS.FIELDS.FIRST_PAGE, { unique: false });
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`, INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
    }
    runMigrations(_db, _oldVersion, _newVersion) {
    }
}
DomainUtils.log("SERVICES DATABASE migrator");
