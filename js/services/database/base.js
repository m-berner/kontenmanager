import { AppError } from '@/domains/errors';
import { SYSTEM } from '@/domains/config/system';
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
                tx.onabort = () => reject(new Error('Transaction aborted'));
            });
        }
        catch (err) {
            tx.abort();
            throw err;
        }
    }
    async add(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'));
        const store = transaction.objectStore(storeName);
        const addData = { ...data };
        if ('cID' in addData) {
            delete addData.cID;
        }
        const request = store.add(addData);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(`Failed to add record to ${storeName}: ${request.error?.message}`, 'DB_ADD_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async get(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'));
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new AppError(`Failed to get record from ${storeName}: ${request.error?.message}`, 'DB_GET_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async getAll(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'));
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(`Failed to getAll records from ${storeName}: ${request.error?.message}`, 'DB_GET_ALL_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async update(storeName, data, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'));
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(`Failed to update record in ${storeName}: ${request.error?.message}`, 'DB_UPDATE_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async remove(storeName, key, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'));
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new AppError(`Failed to remove record from ${storeName}: ${request.error?.message}`, 'DB_REMOVE_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async clear(storeName, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'));
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new AppError(`Failed to clear store ${storeName}: ${request.error?.message}`, 'DB_CLEAR_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async getAllByIndex(storeName, indexName, query, tx) {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'));
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(query);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(`Failed to getAllByIndex from ${storeName} on index ${indexName}: ${request.error?.message}`, 'DB_GET_ALL_BY_INDEX_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
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
            req.onerror = () => reject(new AppError(`Failed to deleteByCursor: ${req.error?.message}`, 'DB_DELETE_BY_CURSOR_FAILED', SYSTEM.ERROR_CATEGORY.DATABASE, {}, false));
        });
    }
    async ensureConnected() {
        if (!this.db) {
            throw new AppError('Database not connected', 'DATABASE_BASE', SYSTEM.ERROR_CATEGORY.DATABASE);
        }
    }
    async getAutoTransaction(storeName, mode) {
        await this.ensureConnected();
        return this.db.transaction(storeName, mode);
    }
}
