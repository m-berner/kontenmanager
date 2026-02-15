import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
export class TransactionManager {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    async execute(storeNames, mode, operation, options = {}) {
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
        this.ensureConnected();
        const tx = this.connection.getDatabase().transaction(stores, mode);
        const timeoutHandle = options.timeout
            ? this.setupTimeout(tx, options.timeout, stores)
            : undefined;
        try {
            options.onProgress?.({ phase: "started" });
            options.onProgress?.({ phase: "executing" });
            const result = await operation(tx);
            options.onProgress?.({ phase: "completing" });
            await this.waitForCompletion(tx);
            options.onProgress?.({ phase: "completed" });
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            return result;
        }
        catch (err) {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            try {
                tx.abort();
            }
            catch {
            }
            throw this.wrapTransactionError(err, stores, mode);
        }
    }
    async executeMultiple(storeNames, mode, operations) {
        return this.execute(storeNames, mode, async (tx) => {
            const results = [];
            for (const operation of operations) {
                const result = await operation(tx);
                results.push(result);
            }
            return results;
        });
    }
    ensureConnected() {
        if (!this.connection.isConnected()) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.I, ERROR_CATEGORY.DATABASE, false);
        }
    }
    waitForCompletion(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error("Transaction aborted"));
        });
    }
    setupTimeout(tx, timeout, stores) {
        return setTimeout(() => {
            DomainUtils.log("DATABASE transaction: timeout", { timeout, stores }, "error");
            try {
                tx.abort();
            }
            catch {
            }
        }, timeout);
    }
    wrapTransactionError(err, stores, mode) {
        if (err instanceof AppError) {
            return err;
        }
        return new AppError(ERROR_CODES.SERVICES.DATABASE.TRANSACTION_FAILED, ERROR_CATEGORY.DATABASE, true, { stores, mode, originalError: err });
    }
}
