import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
export class BaseRepository {
    storeName;
    transactionManager;
    indexes = new Map();
    constructor(storeName, transactionManager, indexes = new Map()) {
        this.storeName = storeName;
        this.transactionManager = transactionManager;
        this.indexes = indexes;
    }
    async findById(id, options = {}) {
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            const result = await this.executeRequest(store.get(id));
            return result || null;
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readonly", operation);
    }
    async findAll(options = {}) {
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            return this.executeRequest(store.getAll());
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readonly", operation);
    }
    async findBy(field, value, options = {}) {
        const indexName = this.indexes.get(field);
        if (!indexName) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.NO_INDEX, ERROR_CATEGORY.DATABASE, false, { storeName: this.storeName, field: String(field) });
        }
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            const index = store.index(indexName);
            return this.executeRequest(index.getAll(value));
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readonly", operation);
    }
    async save(entity, options = {}) {
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            if (entity.cID) {
                const result = await this.executeRequest(store.put(entity));
                return result;
            }
            else {
                const dataToAdd = { ...entity };
                if ("cID" in dataToAdd) {
                    delete dataToAdd.cID;
                }
                const result = await this.executeRequest(store.add(dataToAdd));
                return result;
            }
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readwrite", operation);
    }
    async delete(id, options = {}) {
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            await this.executeRequest(store.delete(id));
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readwrite", operation);
    }
    async deleteBy(field, value, options = {}) {
        const indexName = this.indexes.get(field);
        if (!indexName) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.NO_INDEX, ERROR_CATEGORY.DATABASE, false, { storeName: this.storeName, field: String(field) });
        }
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            const index = store.index(indexName);
            await this.deleteByCursor(index, IDBKeyRange.only(value));
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readwrite", operation);
    }
    async count(options = {}) {
        const operation = async (tx) => {
            const store = tx.objectStore(this.storeName);
            return this.executeRequest(store.count());
        };
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, "readonly", operation);
    }
    async executeRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.REQUEST_FAILED, ERROR_CATEGORY.DATABASE, false, { storeName: this.storeName }));
        });
    }
    async deleteByCursor(index, query) {
        return new Promise((resolve, reject) => {
            const request = index.openCursor(query);
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
                else {
                    resolve();
                }
            };
            request.onerror = () => reject(new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.A, ERROR_CATEGORY.DATABASE, false, { storeName: this.storeName }));
        });
    }
}
