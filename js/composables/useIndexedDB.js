import { INDEXED_DB } from "@/configs/database";
import { databaseService } from "@/services/database";
import { DomainValidators } from "@/domains/validation/validators";
import { DomainUtils } from "@/domains/utils";
function useDBStore(storeName) {
    const dbi = databaseService;
    return {
        add: (data, tx) => dbi.add(storeName, data, tx),
        get: (id, tx) => dbi.get(storeName, id, tx),
        getAll: (tx) => dbi.getAll(storeName, tx),
        update: (data, tx) => dbi.update(storeName, data, tx),
        remove: (id, tx) => dbi.remove(storeName, id, tx),
        clear: (tx) => dbi.clear(storeName, tx),
        batchImport: (batch) => dbi.batchOperations(storeName, batch),
        atomicImport: (stores) => dbi.atomicImport(stores)
    };
}
export function useAccountsDB() {
    const store = useDBStore(INDEXED_DB.STORE.ACCOUNTS.NAME);
    return {
        ...store,
        add: (data, tx) => {
            return store.add(DomainValidators.validateAccount(data), tx);
        },
        update: (data, tx) => {
            return store.update(DomainValidators.validateAccount(data), tx);
        }
    };
}
export function useBookingsDB() {
    const store = useDBStore(INDEXED_DB.STORE.BOOKINGS.NAME);
    return {
        ...store,
        add: (data, tx) => {
            const validated = DomainValidators.validateBooking(data);
            const { cID, ...rest } = validated;
            return store.add(rest, tx);
        },
        update: (data, tx) => {
            return store.update(DomainValidators.validateBooking(data), tx);
        },
        getAll: async (tx) => {
            const records = await store.getAll(tx);
            return records.map((rec) => DomainValidators.validateBooking(rec));
        }
    };
}
export function useBookingTypesDB() {
    const store = useDBStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME);
    return {
        ...store,
        add: (data, tx) => {
            return store.add(DomainValidators.validateBookingType(data), tx);
        },
        update: (data, tx) => {
            return store.update(DomainValidators.validateBookingType(data), tx);
        }
    };
}
export function useStocksDB() {
    const store = useDBStore(INDEXED_DB.STORE.STOCKS.NAME);
    return {
        ...store,
        add: (data, tx) => {
            return store.add(DomainValidators.validateStock(data), tx);
        },
        update: (stockData, tx) => {
            const { mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin, mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb, mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData } = stockData;
            return store.update(DomainValidators.validateStock(cleanData), tx);
        }
    };
}
DomainUtils.log("COMPOSABLE useIndexedDB");
