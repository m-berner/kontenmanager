/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";

/**
 * Low-level base class for IndexedDB operations.
 */
export class IndexedDbBase {
  protected db: IDBDatabase | null = null;
  protected connected: boolean = false;

  async withTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (_tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    await this.ensureConnected();
    const tx = this.db!.transaction(storeNames, mode);
    try {
      const result = await callback(tx);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(new Error("Transaction aborted"));
      });
    } catch (err) {
      tx.abort();
      throw err;
    }
  }

  async add<T>(
    storeName: string,
    data: T,
    tx?: IDBTransaction
  ): Promise<number> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readwrite"));
    const store = transaction.objectStore(storeName);

    // Remove cID if it exists, as IndexedDB with autoIncrement doesn't allow it
    const addData: any = { ...data };
    if ("cID" in addData) {
      delete addData.cID;
    }

    const request = store.add(addData);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.B,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async get<T>(
    storeName: string,
    key: IDBValidKey,
    tx?: IDBTransaction
  ): Promise<T | null> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readonly"));
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.C,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async getAll<T>(storeName: string, tx?: IDBTransaction): Promise<T[]> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readonly"));
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.D,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async update<T>(
    storeName: string,
    data: T,
    tx?: IDBTransaction
  ): Promise<IDBValidKey> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readwrite"));
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.E,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async remove(
    storeName: string,
    key: IDBValidKey,
    tx?: IDBTransaction
  ): Promise<void> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readwrite"));
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.F,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async clear(storeName: string, tx?: IDBTransaction): Promise<void> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readwrite"));
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.G,
            ERROR_CATEGORY.DATABASE,
            {
              input: `${storeName}: ${request.error?.message}`,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    tx?: IDBTransaction
  ): Promise<T[]> {
    const transaction =
      tx || (await this.getAutoTransaction(storeName, "readonly"));
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.H,
            ERROR_CATEGORY.DATABASE,
            {
              input: request.error?.message,
              entity: "database service (base)"
            },
            false
          )
        );
    });
  }

  async deleteByCursor(
    index: IDBIndex,
    query: IDBValidKey | IDBKeyRange
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = index.openCursor(query);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () =>
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.BASE.A,
            ERROR_CATEGORY.DATABASE,
            { input: req.error?.message, entity: "database service" },
            false
          )
        );
    });
  }

  protected async ensureConnected(): Promise<void> {
    if (!this.db) {
      throw new AppError(
        ERROR_CODES.SERVICES.DATABASE.BASE.I,
        ERROR_CATEGORY.DATABASE,
        { input: "Database not connected", entity: "database service (base)" },
        false
      );
    }
  }

  private async getAutoTransaction(
    storeName: string,
    mode: IDBTransactionMode
  ): Promise<IDBTransaction> {
    await this.ensureConnected();
    return this.db!.transaction(storeName, mode);
  }
}
