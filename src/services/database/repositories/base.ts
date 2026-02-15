/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import type { TransactionManager } from "../transaction/manager";

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  tx?: IDBTransaction;
}

/**
 * Base repository providing common CRUD operations
 * Uses composition over inheritance for better testability
 */
export class BaseRepository<T extends { cID?: number }> {
  constructor(
    protected readonly _storeName: string,
    protected readonly _transactionManager: TransactionManager,
    protected readonly _indexes: Map<keyof T, string> = new Map()
  ) {}

  /**
   * Finds a record by its primary key
   */
  async findById(id: number, options: QueryOptions = {}): Promise<T | null> {
    const operation = async (tx: IDBTransaction): Promise<T | null> => {
      const store = tx.objectStore(this._storeName);
      const result = await this.executeRequest<T>(store.get(id));
      return result || null;
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readonly",
      operation
    );
  }

  /**
   * Finds all records in the store
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const operation = async (tx: IDBTransaction): Promise<T[]> => {
      const store = tx.objectStore(this._storeName);
      return this.executeRequest<T[]>(store.getAll());
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readonly",
      operation
    );
  }

  /**
   * Finds records matching a field value using an index
   */
  async findBy(
    field: keyof T,
    value: IDBValidKey,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const indexName = this._indexes.get(field);

    if (!indexName) {
      throw new AppError(
        ERROR_CODES.SERVICES.DATABASE.NO_INDEX,
        ERROR_CATEGORY.DATABASE,
        false,
        { storeName: this._storeName, field: String(field) }
      );
    }

    const operation = async (tx: IDBTransaction): Promise<T[]> => {
      const store = tx.objectStore(this._storeName);
      const index = store.index(indexName);
      return this.executeRequest<T[]>(index.getAll(value));
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readonly",
      operation
    );
  }

  /**
   * Saves a record (insert or update)
   */
  async save(entity: T, options: QueryOptions = {}): Promise<number> {
    const operation = async (tx: IDBTransaction): Promise<number> => {
      const store = tx.objectStore(this._storeName);

      if (entity.cID) {
        // Update existing
        const result = await this.executeRequest(store.put(entity));
        return result as number;
      } else {
        // Insert new
        const dataToAdd: Omit<T, "cID"> = { ...entity };
        if ("cID" in dataToAdd) {
          delete dataToAdd.cID;
        }
        const result = await this.executeRequest(store.add(dataToAdd));
        return result as number;
      }
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readwrite",
      operation
    );
  }

  /**
   * Deletes a record by ID
   */
  async delete(id: number, options: QueryOptions = {}): Promise<void> {
    const operation = async (tx: IDBTransaction): Promise<void> => {
      const store = tx.objectStore(this._storeName);
      await this.executeRequest<undefined>(store.delete(id));
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readwrite",
      operation
    );
  }

  /**
   * Deletes all records matching a field value
   */
  async deleteBy(
    field: keyof T,
    value: IDBValidKey,
    options: QueryOptions = {}
  ): Promise<void> {
    const indexName = this._indexes.get(field);

    if (!indexName) {
      throw new AppError(
        ERROR_CODES.SERVICES.DATABASE.NO_INDEX,
        ERROR_CATEGORY.DATABASE,
        false,
        { storeName: this._storeName, field: String(field) }
      );
    }

    const operation = async (tx: IDBTransaction): Promise<void> => {
      const store = tx.objectStore(this._storeName);
      const index = store.index(indexName);
      await this.deleteByCursor(index, IDBKeyRange.only(value));
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readwrite",
      operation
    );
  }

  /**
   * Counts total records in the store
   */
  async count(options: QueryOptions = {}): Promise<number> {
    const operation = async (tx: IDBTransaction): Promise<number> => {
      const store = tx.objectStore(this._storeName);
      return this.executeRequest<number>(store.count());
    };

    if (options.tx) {
      return operation(options.tx);
    }

    return this._transactionManager.execute(
      this._storeName,
      "readonly",
      operation
    );
  }

  // Protected helper methods

  protected async executeRequest<R>(request: IDBRequest<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.REQUEST_FAILED,
            ERROR_CATEGORY.DATABASE,
            false,
            { storeName: this._storeName }
          )
        );
    });
  }

  protected async deleteByCursor(
    index: IDBIndex,
    query: IDBValidKey | IDBKeyRange
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = index.openCursor(query);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.A,
            ERROR_CATEGORY.DATABASE,
            false,
            { storeName: this._storeName }
          )
        );
    });
  }
}
