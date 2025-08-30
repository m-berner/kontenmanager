/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useConstant} from '@/composables/useConstant'
import type {IAccount, IBooking, IBookingType, IStock, IStockStore, IStores, IStoresDB} from '@/types.d'
import {useNotification} from '@/composables/useNotification'

const {CONS} = useConstant()
const {log, notice} = useNotification()

let db: IDBDatabase | null

export const useIndexedDB = () => {
    const dbi = (): IDBDatabase | null => {
        return db
    }
    const clearStores = async (): Promise<string> => {
        log('USE_INDEXED_DB: clearStores')
        return new Promise(async (resolve, reject) => {
            if (db !== null) {
                const onComplete = async (): Promise<void> => {
                    await notice(['Database is empty!'])
                    resolve('USE_INDEXED_DB: database is empty!')
                }
                const onAbort = (): void => {
                    reject(requestTransaction.error)
                }
                const onError = (): void => {
                    reject(requestTransaction.error)
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
                const onSuccessClearBookings = (): void => {
                    log('USE_INDEXED_DB: bookings dropped')
                }
                const onSuccessClearAccounts = (): void => {
                    log('USE_INDEXED_DB: accounts dropped')
                }
                const onSuccessClearBookingTypes = (): void => {
                    log('USE_INDEXED_DB: booking types dropped')
                }
                const onSuccessClearStocks = (): void => {
                    log('USE_INDEXED_DB: stocks dropped')
                }
                const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear()
                requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE)
                const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
                requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
                const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
                requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
                const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
                requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
            }
        })
    }
    const exportToFile = async (filename: string): Promise<string> => {
        log('USE_INDEXED_DB: exportToFile')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStock[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
            if (db !== null) {
                const onComplete = async (): Promise<void> => {
                    log('USE_INDEXED_DB: exportToFile: data read!')
                    const stringifyDB = (): string => {
                        let buffer: string
                        let i: number
                        buffer = '"accounts":[\n'
                        for (i = 0; i < accounts.length; i++) {
                            buffer += JSON.stringify(accounts[i])
                            if (i === accounts.length - 1) {
                                buffer += '\n],\n'
                            } else {
                                buffer += ',\n'
                            }
                        }
                        buffer += i === 0 ? '],\n' : ''

                        buffer += '"stocks":[\n'
                        for (i = 0; i < stocks.length; i++) {
                            buffer += JSON.stringify(stocks[i])
                            if (i === stocks.length - 1) {
                                buffer += '\n],\n'
                            } else {
                                buffer += ',\n'
                            }
                        }
                        buffer += i === 0 ? '],\n' : ''
                        buffer += '"bookingTypes":[\n'
                        for (i = 0; i < bookingTypes.length; i++) {
                            buffer += JSON.stringify(bookingTypes[i])
                            if (i === bookingTypes.length - 1) {
                                buffer += '\n],\n'
                            } else {
                                buffer += ',\n'
                            }
                        }
                        buffer += i === 0 ? '],\n' : ''
                        buffer += '"bookings":[\n'
                        for (i = 0; i < bookings.length; i++) {
                            buffer += JSON.stringify(bookings[i])
                            if (i === bookings.length - 1) {
                                buffer += '\n]\n'
                            } else {
                                buffer += ',\n'
                            }
                        }
                        return buffer
                    }
                    let buffer = `{\n"sm": {"cVersion":${browser.runtime.getManifest().version.replace(/\./g, '')}, "cDBVersion":${
                        CONS.DB.CURRENT_VERSION
                    }, "cEngine":"indexeddb"},\n`
                    buffer += stringifyDB()
                    buffer += '}'
                    const blob = new Blob([buffer], {type: 'application/json'}) // create blob object with all stores data
                    const blobUrl = URL.createObjectURL(blob) // create url reference for blob object
                    const op: browser.downloads._DownloadOptions = {
                        url: blobUrl,
                        filename
                    }
                    const onDownloadChange = (change: browser.downloads._OnChangedDownloadDelta): void => {
                        log('USE_INDEXED_DB: onDownloadChange')
                        browser.downloads.onChanged.removeListener(onDownloadChange)
                        if (
                            (change.state !== undefined && change.id > 0) ||
                            (change.state !== undefined && change.state.current === CONS.EVENTS.COMP)
                        ) {
                            URL.revokeObjectURL(blobUrl) // release blob object
                        }
                    }
                    browser.downloads.onChanged.addListener(onDownloadChange) // listener to clean up a blob object after the download.
                    await browser.downloads.download(op) // writing blob object into download file
                    await notice(['Database exported!'])
                    resolve('USE_INDEXED_DB: exportToFile: done!')
                }
                const onAbort = (): void => {
                    reject(requestTransaction.error)
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly')
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
                const onSuccessAccountOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        accounts.push(ev.target.result.value)
                        ev.target.result.continue()
                    }
                }
                const onSuccessBookingTypeOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        bookingTypes.push(ev.target.result.value)
                        ev.target.result.continue()
                    }
                }
                const onSuccessBookingOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        bookings.push(ev.target.result.value)
                        ev.target.result.continue()
                    }
                }
                const onSuccessStockOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        stocks.push(ev.target.result.value)
                        ev.target.result.continue()
                    }
                }
                const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor()
                requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false)
                const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor()
                requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false)
                const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor()
                requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false)
                const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor()
                requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false)
            }
        })
    }
    const exportStores = async (aid: number): Promise<IStores> => {
        log('USE_INDEXED_DB: exportStores')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStockStore[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                //const storage = await browser.storage.local.get([CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID])
                const onComplete = async (): Promise<void> => {
                    log('USE_INDEXED_DB: exportStores: all database records sent to frontend!')
                    resolve({accounts, bookings, stocks, bookingTypes})
                }
                const onAbort = (): void => {
                    reject(requestTransaction.error)
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly')
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
                const onSuccessAccountOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        accounts.push(ev.target.result.value)
                        ev.target.result.continue()
                    }
                }
                const onSuccessBookingTypeOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            bookingTypes.push(ev.target.result.value)
                        }
                        ev.target.result.continue()
                    }
                }
                const onSuccessBookingOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            bookings.push(ev.target.result.value)
                        }
                        ev.target.result.continue()
                    }
                }
                const onSuccessStockOpenCursor = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            stocks.push(ev.target.result.value)
                        }
                        ev.target.result.continue()
                    }
                }
                const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor()
                requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false)
                const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor()
                requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false)
                const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor()
                requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false)
                const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor()
                requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false)
            }
        })
    }
    const importStores = async (stores: IStoresDB, all = true) => {
        log('USE_INDEXED_DB: importStores', {info: db})
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onComplete = async (): Promise<void> => {
                    await notice(['All memory records are added to the database!'])
                    resolve('USE_INDEXED_DB: importStores: all memory records are added to the database!')
                }
                const onAbort = (): void => {
                    reject(requestTransaction.error)
                }
                const onError = (ev: Event): void => {
                    reject(ev)
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE)
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
                const onSuccessClearBookings = (): void => {
                    log('USE_INDEXED_DB: bookings dropped')
                    for (let i = 0; i < stores.bookings.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add({...stores.bookings[i]})
                    }
                }
                const onSuccessClearAccounts = (): void => {
                    log('USE_INDEXED_DB: accounts dropped')
                    for (let i = 0; i < stores.accounts.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add({...stores.accounts[i]})
                    }
                }
                const onSuccessClearBookingTypes = (): void => {
                    log('USE_INDEXED_DB: booking types dropped')
                    for (let i = 0; i < stores.bookingTypes.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add({...stores.bookingTypes[i]})
                    }
                }
                const onSuccessClearStocks = (): void => {
                    log('USE_INDEXED_DB: stocks dropped')
                    for (let i = 0; i < stores.stocks.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add({...stores.stocks[i]})
                    }
                }
                const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear()
                requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE)
                if (all) {
                    const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
                    requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
                }
                const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
                requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
                const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
                requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
            }
        })
    }
    const open = async (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            const onError = (ev: Event): void => {
                reject(ev)
            }
            const onSuccess = (ev: Event): void => {
                if (ev.target instanceof IDBOpenDBRequest && ev.target.result) {
                    db = ev.target.result
                    const onVersionChangeSuccess = (): void => {
                        if (db != null) {
                            db.close()
                            notice(['Database is outdated, please reload the page.'])
                        }
                    }
                    db.addEventListener('versionchange', onVersionChangeSuccess, CONS.SYSTEM.ONCE)
                    log('USE_INDEXED_DB: open: database ready', {info: db})
                    resolve('USE_INDEXED_DB: database opened successfully!')
                }
            }
            const openDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION)
            openDBRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            openDBRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
        })
    }
    const addAccount = async (record: Omit<IAccount, 'cID'>) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev: Event) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result)
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add(record)
                requestAdd.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const updateAccount = async (record: IAccount): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev: Event): Promise<void> => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Account updated')
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).put(record)
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const deleteAccount = async (id: number): Promise<string> => {
        // const indexOfAccount = this._accounts.findIndex((account: IAccount) => {
        //   return account.cID === id
        // })
        // TODO only allowed for accounts with no bookings, stocks, bookingTypes
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (): void => {
                    //this._accounts.splice(indexOfAccount, 1)
                    //backendAppMessagePort.get(CONS.MESSAGES.DB__DELETE_ACCOUNT)?.postMessage({type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE, data: id})
                    resolve('Account deleted')
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).delete(id)
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const addBookingType = async (record: Omit<IBookingType, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result)
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add(record)
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const deleteBookingType = async (id: number): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (): void => {
                    resolve('Booking type deleted')
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).delete(id)
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const addBooking = async (record: Omit<IBooking, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result)
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add(record)
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const updateBooking = async (record: IBooking): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev: Event): Promise<void> => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Booking updated')
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).put(record)
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const deleteBooking = async (id: number): Promise<string> => {
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === id
        // })
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (): void => {
                    resolve('Booking deleted')
                }
                const onError = (ev: Event): void => {
                    reject(ev)
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(id)
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const addStock = async (record: Omit<IStock, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev: Event): void => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result)
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add(record)
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const updateStock = async (record: IStock): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev: Event): Promise<void> => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Stock updated')
                    }
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev)
                    }
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).put(record)
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    const deleteStock = async (id: number): Promise<string> => {
        log('USE_INDEXED_DB: deleteStock')
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === id
        // })
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (): void => {
                    //this._bookings.all.splice(indexOfBooking, 1)
                    //backendAppMessagePort.postMessage({type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE, data: id})
                    //this.sumBookings()
                    resolve('Stock deleted')
                    return
                }
                const onError = (ev: Event): void => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message)
                    }
                    return
                }
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).delete(id)
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
            }
        })
    }
    return {
        dbi,
        clearStores,
        exportToFile,
        exportStores,
        importStores,
        open,
        addAccount,
        updateAccount,
        deleteAccount,
        addBookingType,
        deleteBookingType,
        addBooking,
        updateBooking,
        deleteBooking,
        addStock,
        updateStock,
        deleteStock
    }
}
