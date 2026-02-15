import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
const VALID_STORES = [
    INDEXED_DB.STORE.ACCOUNTS.NAME,
    INDEXED_DB.STORE.BOOKINGS.NAME,
    INDEXED_DB.STORE.STOCKS.NAME,
    INDEXED_DB.STORE.BOOKING_TYPES.NAME
];
export class BatchOperationService {
    _transactionManager;
    constructor(_transactionManager) {
        this._transactionManager = _transactionManager;
    }
    async executeAtomic(descriptors) {
        const startTime = performance.now();
        this.validateDescriptors(descriptors);
        const storeNames = descriptors.map((d) => d.storeName);
        DomainUtils.log("DATABASE batch: starting atomic operation", {
            stores: storeNames,
            totalOperations: descriptors.reduce((sum, d) => sum + d.operations.length, 0)
        });
        await this._transactionManager.execute(storeNames, "readwrite", async (tx) => {
            for (const descriptor of descriptors) {
                const store = tx.objectStore(descriptor.storeName);
                await this.executeOperations(store, descriptor.operations);
            }
        });
        const duration = Math.round(performance.now() - startTime);
        DomainUtils.log("DATABASE batch: atomic operation completed", { duration });
    }
    async executeBatch(storeName, operations) {
        return this.executeAtomic([{ storeName, operations }]);
    }
    createBuilder() {
        return new BatchOperationBuilder(this);
    }
    validateDescriptors(descriptors) {
        if (descriptors.length === 0) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.INVALID_BATCH, ERROR_CATEGORY.DATABASE, false, { reason: "No operations provided" });
        }
        for (const descriptor of descriptors) {
            if (!VALID_STORES.includes(descriptor.storeName)) {
                throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false, { storeName: descriptor.storeName });
            }
            if (descriptor.operations.length === 0) {
                throw new AppError(ERROR_CODES.SERVICES.DATABASE.INVALID_BATCH, ERROR_CATEGORY.DATABASE, false, { storeName: descriptor.storeName, reason: "No operations for store" });
            }
        }
    }
    async executeOperations(store, operations) {
        for (const operation of operations) {
            await this.executeOperation(store, operation);
        }
    }
    async executeOperation(store, operation) {
        switch (operation.type) {
            case "add":
                await this.promisifyRequest(store.add(operation.data));
                break;
            case "put":
                await this.promisifyRequest(store.put(operation.data));
                break;
            case "delete":
                if (!operation.key) {
                    throw new AppError(ERROR_CODES.SERVICES.DATABASE.C, ERROR_CATEGORY.DATABASE, false, { operation: "delete", reason: "Missing key" });
                }
                await this.promisifyRequest(store.delete(operation.key));
                break;
            case "clear":
                await this.promisifyRequest(store.clear());
                break;
            default:
                throw new AppError(ERROR_CODES.SERVICES.DATABASE.D, ERROR_CATEGORY.DATABASE, false, { operation: operation.type });
        }
    }
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}
export class BatchOperationBuilder {
    _service;
    descriptors = new Map();
    constructor(_service) {
        this._service = _service;
    }
    add(storeName, operation) {
        if (!this.descriptors.has(storeName)) {
            this.descriptors.set(storeName, []);
        }
        this.descriptors.get(storeName).push(operation);
        return this;
    }
    insert(storeName, data) {
        return this.add(storeName, { type: "add", data });
    }
    update(storeName, data) {
        return this.add(storeName, { type: "put", data });
    }
    remove(storeName, key) {
        return this.add(storeName, { type: "delete", key });
    }
    clear(storeName) {
        return this.add(storeName, { type: "clear" });
    }
    async execute() {
        const descriptors = Array.from(this.descriptors.entries()).map(([storeName, operations]) => ({ storeName, operations }));
        return this._service.executeAtomic(descriptors);
    }
    getOperationCount() {
        return Array.from(this.descriptors.values()).reduce((sum, ops) => sum + ops.length, 0);
    }
    reset() {
        this.descriptors.clear();
        return this;
    }
}
