/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import type {
  BookingDb,
  BookingTypeDb,
  RecordOperation,
  RecordsDbData,
  StockDb
} from "@/types";
import { INDEXED_DB } from "@/configs/database";
import { IndexedDbBase } from "./database/base";
import { DatabaseMigrator } from "./database/migrator";
import {
  AccountRepository,
  BookingRepository,
  BookingTypeRepository,
  StockRepository
} from "./database/repositories/repositories";

/**
 * Valid store names for operations
 */
const VALID_STORE_NAMES = [
  INDEXED_DB.STORE.ACCOUNTS.NAME,
  INDEXED_DB.STORE.BOOKINGS.NAME,
  INDEXED_DB.STORE.STOCKS.NAME,
  INDEXED_DB.STORE.BOOKING_TYPES.NAME
] as const;

/**
 * Service for managing IndexedDB operations.
 * Orchestrates specialized repositories and handles the core database lifecycle.
 */
export class DatabaseService extends IndexedDbBase {
  public accounts = new AccountRepository(this);
  public bookings = new BookingRepository(this);
  public bookingTypes = new BookingTypeRepository(this);
  public stocks = new StockRepository(this);
  private migrator = new DatabaseMigrator();

  constructor() {
    super();
  }

  /**
   * Checks if the database is currently connected.
   * @returns True if connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Establishes a connection to the IndexedDB database.
   *
   * @returns A promise that resolves when connected.
   */
  async connect(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        INDEXED_DB.NAME,
        INDEXED_DB.CURRENT_VERSION
      );

      request.onerror = () => {
        this.handleConnectionError();
        reject(
          new AppError(
            ERROR_CODES.SERVICES.DATABASE.A,
            ERROR_CATEGORY.DATABASE,
            false
          )
        );
      };

      request.onsuccess = () => {
        this.handleConnectionSuccess(request.result);
        resolve();
      };

      request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
        this.migrator.setupDatabase(request.result, ev);
      };
    });
  }

  /**
   * Closes the connection to the database.
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
      } catch (err) {
        DomainUtils.log("SERVICES database", err, "error");
      } finally {
        this.resetConnection();
      }
    }
  }

  /**
   * Performs atomic operations across multiple stores within a single transaction
   *
   * @param stores - Array of store operations to perform
   * @throws AppError if invalid store names or operations are provided
   */
  async atomicImport(
    stores: { storeName: string; operations: RecordOperation[] }[]
  ): Promise<void> {
    this.validateStoreNames(stores.map((s) => s.storeName));

    return this.withTransaction(
      stores.map((s) => s.storeName),
      "readwrite",
      async (tx) => {
        for (const { storeName, operations } of stores) {
          await this.executeOperations(tx.objectStore(storeName), operations);
        }
      }
    );
  }

  /**
   * Performs batch operations on a single store
   *
   * @param storeName - Target store name
   * @param operations - Operations to perform
   */
  async batchOperations(
    storeName: string,
    operations: RecordOperation[]
  ): Promise<void> {
    return this.withTransaction(storeName, "readwrite", async (tx) => {
      await this.executeOperations(tx.objectStore(storeName), operations);
    });
  }

  /**
   * Retrieves all records for a specific account across all stores
   *
   * @param accountId - Account identifier
   * @returns Complete set of account records
   */
  async getAccountRecords(accountId: number): Promise<RecordsDbData> {
    DomainUtils.log("SERVICES database: getAccountRecords");

    return this.withTransaction(
      [
        INDEXED_DB.STORE.BOOKINGS.NAME,
        INDEXED_DB.STORE.BOOKING_TYPES.NAME,
        INDEXED_DB.STORE.STOCKS.NAME,
        INDEXED_DB.STORE.ACCOUNTS.NAME
      ],
      "readonly",
      async (tx) => {
        const [accounts, bookings, bookingTypes, stocks] = await Promise.all([
          this.accounts.getAll(tx),
          this.bookings.getAllByAccount(accountId, tx),
          this.bookingTypes.getAllByAccount(accountId, tx),
          this.stocks.getAllByAccount(accountId, tx)
        ]);

        return {
          accountsDB: accounts,
          bookingsDB: bookings,
          bookingTypesDB: bookingTypes,
          stocksDB: stocks
        };
      }
    );
  }

  /**
   * Deletes all records associated with an account
   *
   * @param accountId - Account identifier
   */
  async deleteAccountRecords(accountId: number): Promise<void> {
    return this.withTransaction(
      [
        INDEXED_DB.STORE.BOOKINGS.NAME,
        INDEXED_DB.STORE.BOOKING_TYPES.NAME,
        INDEXED_DB.STORE.STOCKS.NAME,
        INDEXED_DB.STORE.ACCOUNTS.NAME
      ],
      "readwrite",
      async (tx) => {
        // Delete dependent records first
        await Promise.all([
          this.bookings.deleteByAccount(accountId, tx),
          this.bookingTypes.deleteByAccount(accountId, tx),
          this.stocks.deleteByAccount(accountId, tx)
        ]);

        // Then delete the account itself
        await this.accounts.delete(accountId, tx);
      }
    );
  }

  /**
   * Performs a health check on the database.
   * Identifies orphaned records (records pointing to non-existent accounts).
   *
   * @returns A report of health issues found.
   */
  async healthCheck(): Promise<{
    orphanedBookings: number;
    orphanedStocks: number;
    orphanedBookingTypes: number;
  }> {
    return this.withTransaction(
      [
        INDEXED_DB.STORE.ACCOUNTS.NAME,
        INDEXED_DB.STORE.BOOKINGS.NAME,
        INDEXED_DB.STORE.STOCKS.NAME,
        INDEXED_DB.STORE.BOOKING_TYPES.NAME
      ],
      "readonly",
      async (tx) => {
        const accounts = await this.accounts.getAll(tx);
        const accountIds = new Set(accounts.map((a) => a.cID));

        const [bookings, stocks, bookingTypes] = await Promise.all([
          this.getAll<BookingDb>(INDEXED_DB.STORE.BOOKINGS.NAME, tx),
          this.getAll<StockDb>(INDEXED_DB.STORE.STOCKS.NAME, tx),
          this.getAll<BookingTypeDb>(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx)
        ]);

        return {
          orphanedBookings: this.countOrphaned(
            bookings,
            accountIds,
            "cAccountNumberID"
          ),
          orphanedStocks: this.countOrphaned(
            stocks,
            accountIds,
            "cAccountNumberID"
          ),
          orphanedBookingTypes: this.countOrphaned(
            bookingTypes,
            accountIds,
            "cAccountNumberID"
          )
        };
      }
    );
  }

  /**
   * Repairs the database by removing orphaned records.
   */
  async repairDatabase(): Promise<void> {
    await this.withTransaction(
      [
        INDEXED_DB.STORE.ACCOUNTS.NAME,
        INDEXED_DB.STORE.BOOKINGS.NAME,
        INDEXED_DB.STORE.STOCKS.NAME,
        INDEXED_DB.STORE.BOOKING_TYPES.NAME
      ],
      "readwrite",
      async (tx) => {
        const accounts = await this.accounts.getAll(tx);
        const accountIds = new Set(accounts.map((a) => a.cID));

        await Promise.all([
          this.removeOrphaned(
            tx,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            accountIds,
            "cAccountNumberID"
          ),
          this.removeOrphaned(
            tx,
            INDEXED_DB.STORE.STOCKS.NAME,
            accountIds,
            "cAccountNumberID"
          ),
          this.removeOrphaned(
            tx,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            accountIds,
            "cAccountNumberID"
          )
        ]);
      }
    );
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Handles successful database connection
   */
  private handleConnectionSuccess(db: IDBDatabase): void {
    this.db = db;
    this.connected = true;
    this.setupEventHandlers();
  }

  /**
   * Handles connection errors
   */
  private handleConnectionError(): void {
    this.resetConnection();
  }

  /**
   * Resets connection state
   */
  private resetConnection(): void {
    this.db = null;
    this.connected = false;
  }

  /**
   * Validates that all store names are valid
   */
  private validateStoreNames(storeNames: string[]): void {
    const invalidStores = storeNames.filter(
      (name) => !VALID_STORE_NAMES.includes(name as any)
    );

    if (invalidStores.length > 0) {
      throw new AppError(
        ERROR_CODES.SERVICES.DATABASE.D,
        ERROR_CATEGORY.DATABASE,
        false
      );
    }
  }

  /**
   * Executes a list of operations on a store
   */
  private async executeOperations(
    store: IDBObjectStore,
    operations: RecordOperation[]
  ): Promise<void> {
    for (const op of operations) {
      this.executeOperation(store, op);
    }
  }

  /**
   * Executes a single operation on a store
   */
  private executeOperation(store: IDBObjectStore, op: RecordOperation): void {
    switch (op.type) {
      case "add":
        store.add(op.data);
        break;
      case "put":
        store.put(op.data);
        break;
      case "delete":
        if (!op.key) {
          throw new AppError(
            ERROR_CODES.SERVICES.DATABASE.C,
            ERROR_CATEGORY.DATABASE,
            false
          );
        }
        store.delete(op.key);
        break;
      case "clear":
        store.clear();
        break;
      default:
        throw new AppError(
          ERROR_CODES.SERVICES.DATABASE.D,
          ERROR_CATEGORY.DATABASE,
          false
        );
    }
  }

  /**
   * Counts orphaned records (records with invalid foreign keys)
   */
  private countOrphaned<T extends Record<string, any>>(
    records: T[],
    validIds: Set<number>,
    foreignKeyField: keyof T
  ): number {
    return records.filter((r) => !validIds.has(r[foreignKeyField])).length;
  }

  /**
   * Removes orphaned records from a store
   */
  private async removeOrphaned(
    tx: IDBTransaction,
    storeName: string,
    validIds: Set<number>,
    foreignKeyField: string
  ): Promise<void> {
    const records = await this.getAll<any>(storeName, tx);
    const store = tx.objectStore(storeName);

    for (const record of records) {
      if (!validIds.has(record[foreignKeyField])) {
        store.delete(record.cID);
      }
    }
  }

  /**
   * Sets up event handlers for database lifecycle events
   */
  private setupEventHandlers(): void {
    if (!this.db) return;

    this.db.onversionchange = () => {
      this.db!.close();
      this.resetConnection();
      window.location.reload();
    };

    this.db.onclose = () => {
      this.resetConnection();
    };
  }
}

export const databaseService = new DatabaseService();

DomainUtils.log("SERVICES database");
