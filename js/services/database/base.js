import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
export class IndexedDbBase {
    db = null;
    connected = false;
    async withTransaction(storeNames, mode, callback) {
        await this.ensureConnected();
        const tx = this.db.transaction(storeNames, mode);
        try {
            const result = await callback(tx);
            await this.waitForTransactionComplete(tx);
            return result;
        }
        catch (err) {
            tx.abort();
            throw err;
        }
    }
    waitForTransactionComplete(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error("Transaction aborted"));
        });
    }
    async add(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const addData = { ...data };
        if ("cID" in addData) {
            delete addData.cID;
        }
        const result = await this.executeRequest(store.add(addData), ERROR_CODES.SERVICES.DATABASE.BASE.B);
        return result;
    }
    async get(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        const result = await this.executeRequest(store.get(key), ERROR_CODES.SERVICES.DATABASE.BASE.C);
        return result || null;
    }
    async getAll(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        return this.executeRequest(store.getAll(), ERROR_CODES.SERVICES.DATABASE.BASE.D);
    }
    async update(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const result = await this.executeRequest(store.put(data), ERROR_CODES.SERVICES.DATABASE.BASE.E);
        return result;
    }
    async remove(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        await this.executeRequest(store.delete(key), ERROR_CODES.SERVICES.DATABASE.BASE.F);
    }
    async clear(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        await this.executeRequest(store.clear(), ERROR_CODES.SERVICES.DATABASE.BASE.G);
    }
    async getAllByIndex(storeName, indexName, query, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return this.executeRequest(index.getAll(query), ERROR_CODES.SERVICES.DATABASE.BASE.H);
    }
    async deleteByCursor(index, query) {
        return new Promise((resolve, reject) => {
            const req = index.openCursor(query);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
                else {
                    resolve();
                }
            };
            req.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.A, ERROR_CATEGORY.DATABASE, false));
        });
    }
    executeRequest(request, errorCode) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(errorCode, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async ensureConnected() {
        if (!this.db) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.I, ERROR_CATEGORY.DATABASE, false);
        }
    }
    async getAutoTransaction(storeName, mode) {
        await this.ensureConnected();
        return this.db.transaction(storeName, mode);
    }
}
export class BaseRepository {
    _dbBase;
    constructor(_dbBase) {
        this._dbBase = _dbBase;
    }
    async _getAllByAccount(storeName, indexName, accountId, tx) {
        return this._dbBase.getAllByIndex(storeName, indexName, accountId, tx);
    }
    async _deleteByAccount(storeName, indexName, accountId, tx) {
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        return this._dbBase.deleteByCursor(index, IDBKeyRange.only(accountId));
    }
    async _getAll(storeName, tx) {
        return this._dbBase.getAll(storeName, tx);
    }
    async _delete(storeName, id, tx) {
        return this._dbBase.remove(storeName, id, tx);
    }
}
DomainUtils.log("SERVICES DATABASE base");
