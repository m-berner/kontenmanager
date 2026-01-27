/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {AppError, ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import type {BookingDb, BookingTypeDb, RecordOperation, RecordsDbData, StockDb} from '@/types'
import {INDEXED_DB} from '@/config/database'
import {IndexedDbBase} from './database/base'
import {DatabaseMigrator} from './database/migrator'
import {AccountRepository} from './database/repositories/AccountRepository'
import {BookingRepository} from './database/repositories/BookingRepository'
import {BookingTypeRepository} from './database/repositories/BookingTypeRepository'
import {StockRepository} from './database/repositories/StockRepository'

/**
 * Service for managing IndexedDB operations.
 * Orchestrates specialized repositories and handles the core database lifecycle.
 */
export class DatabaseService extends IndexedDbBase {
    public accounts = new AccountRepository(this)
    public bookings = new BookingRepository(this)
    public bookingTypes = new BookingTypeRepository(this)
    public stocks = new StockRepository(this)
    private migrator = new DatabaseMigrator()

    constructor() {
        super()
    }

    /**
     * Checks if the database is currently connected.
     * @returns True if connected.
     */
    isConnected(): boolean {
        return this.connected
    }

    /**
     * Establishes a connection to the IndexedDB database.
     *
     * @returns A promise that resolves when connected.
     */
    async connect(): Promise<void> {
        if (this.db) return

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB.NAME, INDEXED_DB.VERSION)

            request.onerror = () => {
                this.db = null
                this.connected = false
                reject(new AppError(
                    ERROR_CODES.SERVICES.DATABASE.A,
                    ERROR_CATEGORY.DATABASE,
                    {input: request.error, entity: 'database service (connect)'},
                    false
                ))
            }

            request.onsuccess = () => {
                this.db = request.result
                this.connected = true
                this.setupEventHandlers()
                resolve()
            }

            request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
                this.migrator.setupDatabase(request.result, ev)
            }
        })
    }

    /**
     * Closes the connection to the database.
     */
    async disconnect(): Promise<void> {
        if (this.db) {
            try {
                this.db.close()
            } catch (err) {
                throw new AppError(
                    ERROR_CODES.SERVICES.DATABASE.B,
                    ERROR_CATEGORY.DATABASE,
                    {input: err, entity: 'database service (disconnect)'},
                    true
                )
            } finally {
                this.db = null
                this.connected = false
            }
        }
    }

    async atomicImport(stores: { storeName: string, operations: RecordOperation[] }[]): Promise<void> {
        return this.withTransaction(
            stores.map(s => s.storeName),
            'readwrite',
            async (tx) => {
                for (const {storeName, operations} of stores) {
                    const store = tx.objectStore(storeName)
                    for (const op of operations) {
                        switch (op.type) {
                            case 'add':
                                store.add(op.data)
                                break
                            case 'put':
                                store.put(op.data)
                                break
                            case 'delete':
                                if (!op.key) throw new AppError(
                                    ERROR_CODES.SERVICES.DATABASE.C,
                                    ERROR_CATEGORY.DATABASE,
                                    {operation: op, storeName},
                                    false
                                )
                                store.delete(op.key)
                                break
                            case 'clear':
                                store.clear()
                                break
                            default:
                                throw new AppError(
                                    ERROR_CODES.SERVICES.DATABASE.D,
                                    ERROR_CATEGORY.DATABASE,
                                    {input: op, entity: storeName},
                                    false
                                )
                        }
                    }
                }
            }
        )
    }

    async batchOperations(storeName: string, operations: RecordOperation[]): Promise<void> {
        return this.withTransaction(storeName, 'readwrite', async (tx) => {
            const store = tx.objectStore(storeName)
            for (const op of operations) {
                switch (op.type) {
                    case 'add':
                        store.add(op.data)
                        break
                    case 'put':
                        store.put(op.data)
                        break
                    case 'delete':
                        if (!op.key) throw new AppError(
                            ERROR_CODES.SERVICES.DATABASE.E,
                            ERROR_CATEGORY.DATABASE,
                            {input: op, entity: storeName},
                            false
                        )
                        store.delete(op.key)
                        break
                    case 'clear':
                        store.clear()
                        break
                    default:
                        throw new AppError(
                            ERROR_CODES.SERVICES.DATABASE.F,
                            ERROR_CATEGORY.DATABASE,
                            {operation: op, entity:  storeName},
                            false
                        )
                }
            }
        })
    }

    async getAccountRecords(accountId: number): Promise<RecordsDbData> {
        UtilsService.log('DATABASE: getAccountRecords')
        return this.withTransaction(
            [
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.ACCOUNTS.NAME
            ],
            'readonly',
            async (tx) => {
                const [accounts, bookings, bookingTypes, stocks] = await Promise.all(
                    [
                        this.accounts.getAll(tx),
                        this.bookings.getAllByAccount(accountId, tx),
                        this.bookingTypes.getAllByAccount(accountId, tx),
                        this.stocks.getAllByAccount(accountId, tx)
                    ]
                )
                return {accountsDB: accounts, bookingsDB: bookings, bookingTypesDB: bookingTypes, stocksDB: stocks}
            }
        )
    }

    async deleteAccountRecords(accountId: number): Promise<void> {
        return this.withTransaction(
            [
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.ACCOUNTS.NAME
            ],
            'readwrite',
            async (tx) => {
                await Promise.all(
                    [
                        this.bookings.deleteByAccount(accountId, tx),
                        this.bookingTypes.deleteByAccount(accountId, tx),
                        this.stocks.deleteByAccount(accountId, tx)
                    ]
                )
                await this.accounts.delete(accountId, tx)
            }
        )
    }

    /**
     * Performs a health check on the database.
     * Identifies orphaned records (records pointing to non-existent accounts).
     *
     * @returns A report of health issues found.
     */
    async healthCheck(): Promise<{ orphanedBookings: number, orphanedStocks: number, orphanedBookingTypes: number }> {
        return this.withTransaction(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME
            ],
            'readonly',
            async (tx) => {
                const accounts = await this.accounts.getAll(tx)
                const accountIds = new Set(accounts.map(a => a.cID))

                const bookings = await this.getAll<BookingDb>(INDEXED_DB.STORE.BOOKINGS.NAME, tx)
                const stocks = await this.getAll<StockDb>(INDEXED_DB.STORE.STOCKS.NAME, tx)
                const bookingTypes = await this.getAll<BookingTypeDb>(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx)

                const orphanedBookings = bookings.filter(b => !accountIds.has(b.cAccountNumberID)).length
                const orphanedStocks = stocks.filter(s => !accountIds.has(s.cAccountNumberID)).length
                const orphanedBookingTypes = bookingTypes.filter(bt => !accountIds.has(bt.cAccountNumberID)).length

                return {orphanedBookings, orphanedStocks, orphanedBookingTypes}
            }
        )
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
            'readwrite',
            async (tx) => {
                const accounts = await this.accounts.getAll(tx)
                const accountIds = new Set(accounts.map(a => a.cID))

                const bookings = await this.getAll<BookingDb>(INDEXED_DB.STORE.BOOKINGS.NAME, tx)
                for (const b of bookings) {
                    if (!accountIds.has(b.cAccountNumberID)) {
                        tx.objectStore(INDEXED_DB.STORE.BOOKINGS.NAME).delete(b.cID)
                    }
                }

                const stocks = await this.getAll<StockDb>(INDEXED_DB.STORE.STOCKS.NAME, tx)
                for (const s of stocks) {
                    if (!accountIds.has(s.cAccountNumberID)) {
                        tx.objectStore(INDEXED_DB.STORE.STOCKS.NAME).delete(s.cID)
                    }
                }

                const bookingTypes = await this.getAll<BookingTypeDb>(INDEXED_DB.STORE.BOOKING_TYPES.NAME, tx)
                for (const bt of bookingTypes) {
                    if (!accountIds.has(bt.cAccountNumberID)) {
                        tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME).delete(bt.cID)
                    }
                }
            }
        )
    }

    private setupEventHandlers(): void {
        if (!this.db) return

        this.db.onversionchange = () => {
            this.db!.close()
            this.db = null
            this.connected = false
            window.location.reload()
        }

        this.db.onclose = () => {
            this.connected = false
            this.db = null
        }
    }
}

export const databaseService = new DatabaseService()

UtilsService.log('--- services/database.ts ---')
