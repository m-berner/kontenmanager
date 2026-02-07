import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
export class IndexedDbBase {
    db = null;
    connected = false;
    async withTransaction(storeNames, mode, callback) {
        await this.ensureConnected();
        const tx = this.db.transaction(storeNames, mode);
        try {
            const result = await callback(tx);
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(new Error("Transaction aborted"));
            });
        }
        catch (err) {
            tx.abort();
            throw err;
        }
    }
    async add(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const addData = { ...data };
        if ("cID" in addData) {
            delete addData.cID;
        }
        const request = store.add(addData);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.B, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async get(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.C, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async getAll(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.D, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async update(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.E, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async remove(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.F, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async clear(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readwrite"));
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.G, ERROR_CATEGORY.DATABASE, false));
        });
    }
    async getAllByIndex(storeName, indexName, query, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, "readonly"));
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(query);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.H, ERROR_CATEGORY.DATABASE, false));
        });
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
