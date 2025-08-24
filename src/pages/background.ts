/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useApp} from '@/composables/useApp'
import {useDatabase} from '@/composables/useDatabase'
import {useFetch} from '@/composables/useFetch'
//import {useI18n} from "vue-i18n";
//import {useRuntimeStore} from "@/stores/runtime";
//import {useRecordsStore} from "@/stores/records";

declare global {
    namespace Stockmanager {
        interface IStock {
            cID: number
            cCompany: string
            cISIN: string
            cWKN: string
            cSym: string
            cMeetingDay: number
            cQuarterDay: number
            cFadeOut: number
            cFirstPage: number
            cURL: string
        }

        interface ITransfer {
            cID: number
            cStockID: number
            cDate: number
            cExDay: number
            cUnitQuotation: number
            cAmount: number
            cCount: number
            cFees: number
            cSTax: number
            cFTax: number
            cTax: number
            cSoli: number
            cMarketPlace: string
            cDescription: string
            cType: number
        }
    }
    namespace FetchedResources {
        type TIdIsin = {
            id: number
            isin: string
        }

        interface ICompanyData {
            company: string
            wkn: string
            symbol: string
        }

        interface IMinRateMaxData {
            id: number,
            isin: string,
            rate: string,
            min: string,
            max: string,
            cur: string
        }

        interface IDailyChangesData {
            key: string
            value: {
                percentChange: string,
                change: number,
                stringChange: string
            }
        }

        interface IExchangesData {
            key: string,
            value: number
        }

        interface IMaterialData {
            key: string,
            value: number
        }

        interface IIndexData {
            key: string,
            value: number
        }

        interface IDatesData {
            key: number | undefined
            value: {
                qf: number
                gm: number
            }
        }
    }

    interface IAccount {
        // NOTE: correlates with CONS.DB.STORES.ACCOUNTS.FIELDS
        cID: number
        cSwift: string
        cNumber: string
        cLogoUrl: string
        cStockAccount: boolean
    }

    interface IBookingType {
        // NOTE: correlates with CONS.DB.STORES.BOOKING_TYPES.FIELDS
        cID: number
        cName: string
        cAccountNumberID: number
    }

    interface IBooking {
        // NOTE: correlates with CONS.DB.STORES.BOOKING.FIELDS
        cID: number
        cDate: string
        cExDate: string
        cDebit: number
        cCredit: number
        cDescription: string
        cCount: number
        cBookingTypeID: number
        cAccountNumberID: number
        cStockID: number
        cSoli: number
        cTax: number
        cFee: number
        cSourceTax: number
        cTransactionTax: number
        cMarketPlace: string
    }

    interface IStock {
        // NOTE: correlates with CONS.DB.STORES.STOCK.FIELDS
        cID: number
        cCompany: string
        cISIN: string
        cWKN: string
        cSymbol: string
        cFirstPage: number
        cFadeOut: number
        cMeetingDay: string
        cQuarterDay: string
        cURL: string
        cAccountNumberID: number
    }

    interface IStockStore {
        cID: number
        cCompany: string
        cISIN: string
        cWKN: string
        cSymbol: string
        cMeetingDay: string
        cQuarterDay: string
        cFadeOut: number
        cFirstPage: number
        cURL: string
        cAccountNumberID: number
        mPortfolio: number
        mChange: number
        mBuyValue: number
        mEuroChange: number
        mMin: number
        mValue: number
        mMax: number
    }

    interface IBackup {
        sm: {
            cVersion: number
            cDBVersion: number
            cEngine: string
        }
        accounts: IAccount[]
        bookings: IBooking[]
        bookingTypes: IBookingType[]
        stocks: IStock[] & Stockmanager.IStock[]
        transfers?: IBooking[] & Stockmanager.ITransfer[]
    }

    interface IStoresDB {
        accounts: IAccount[],
        bookings: IBooking[],
        bookingTypes: IBookingType[],
        stocks: IStock[]
    }

    interface IStores {
        accounts: IAccount[],
        bookings: IBooking[],
        bookingTypes: IBookingType[],
        stocks: IStockStore[]
    }

    interface IDrawerControls {
        id: number
        title: string
        value: string
        class: string
    }

    interface IStorageLocal {
        sActiveAccountId: number
        sBookingsPerPage: number
        sStocksPerPage: number
        sPartner: boolean
        sSkin: string
        sService: string
        sExchanges: string[]
        sMaterials: string[]
        sIndexes: string[]
        sMarkets: string[]
    }

    interface IService {
        NAME: string
        HOME: string
        QUOTE: string
    }

    interface IContent {
        title: string
        content: string
        icon: string
    }

    type StocksMenuItems = {
        readonly title: string
        readonly id: string
        readonly icon: string
    }

    interface IDrawerControl {
        id: number
        title: string
        value: string
        class: string
    }

    interface IState {
        show: boolean
        drawerControls: IDrawerControl[]
    }
}

const {CONS, log} = useApp()

if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
    const {
        clearStores,
        exportToFile,
        addAccount,
        updateAccount,
        deleteAccount,
        addBooking,
        deleteBooking,
        addBookingType,
        deleteBookingType,
        addStock,
        updateStock,
        updateBooking,
        exportStores,
        importStores,
        deleteStock,
        open
    } = useDatabase()
    const {
        fetchCompanyData,
        fetchMinRateMaxData,
        fetchDailyChangeData,
        fetchExchangesData,
        fetchMaterialData,
        fetchIndexData,
        fetchDateData
    } = useFetch()
    // NOTE: onInstall runs at addon install, addon update and firefox update
    const onInstall = async (): Promise<void> => {
        console.log('BACKGROUND: onInstall')
        const installStorageLocal = async () => {
            const storageLocal = await browser.storage.local.get()
            if (storageLocal[CONS.STORAGE.PROPS.SKIN] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.SKIN]: CONS.DEFAULTS.STORAGE.SKIN})
            }
            if (storageLocal[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID})
            }
            if (storageLocal[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE]: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE})
            }
            if (storageLocal[CONS.STORAGE.PROPS.STOCKS_PER_PAGE] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.STOCKS_PER_PAGE]: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE})
            }
            if (storageLocal[CONS.STORAGE.PROPS.PARTNER] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.PARTNER]: CONS.DEFAULTS.STORAGE.PARTNER})
            }
            if (storageLocal[CONS.STORAGE.PROPS.SERVICE] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.SERVICE]: CONS.DEFAULTS.STORAGE.SERVICE})
            }
            if (storageLocal[CONS.STORAGE.PROPS.EXCHANGES] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.EXCHANGES]: CONS.DEFAULTS.STORAGE.EXCHANGES})
            }
            if (storageLocal[CONS.STORAGE.PROPS.INDEXES] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.INDEXES]: CONS.DEFAULTS.STORAGE.INDEXES})
            }
            if (storageLocal[CONS.STORAGE.PROPS.MARKETS] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.MARKETS]: CONS.DEFAULTS.STORAGE.MARKETS})
            }
            if (storageLocal[CONS.STORAGE.PROPS.MATERIALS] === undefined) {
                await browser.storage.local.set({[CONS.STORAGE.PROPS.MATERIALS]: CONS.DEFAULTS.STORAGE.MATERIALS})
            }
            console.log('BACKGROUND: installStorageLocal: DONE')
        }
        const onSuccess = (ev: Event): void => {
            if (ev.target instanceof IDBRequest) {
                ev.target.result.close()
            }
            console.log('BACKGROUND: onInstall: DONE')
        }
        const onError = (ev: Event): void => {
            console.error('BACKGROUND: onError: ', ev)
        }
        const onUpgradeNeeded = async (ev: Event): Promise<void> => {
            if (ev instanceof IDBVersionChangeEvent) {
                console.info('BACKGROUND: onInstall: onUpgradeNeeded', ev.newVersion)
                const createDB = (): void => {
                    console.log('BACKGROUND: onInstall: onUpgradeNeeded: createDB')
                    const requestCreateAccountStore = dbOpenRequest.result.createObjectStore(
                        CONS.DB.STORES.ACCOUNTS.NAME,
                        {
                            keyPath: CONS.DB.STORES.ACCOUNTS.FIELDS.ID,
                            autoIncrement: true
                        })
                    const requestCreateBookingStore = dbOpenRequest.result.createObjectStore(
                        CONS.DB.STORES.BOOKINGS.NAME,
                        {
                            keyPath: CONS.DB.STORES.BOOKINGS.FIELDS.ID,
                            autoIncrement: true
                        }
                    )
                    const requestCreateBookingTypeStore = dbOpenRequest.result.createObjectStore(
                        CONS.DB.STORES.BOOKING_TYPES.NAME,
                        {
                            keyPath: CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID,
                            autoIncrement: true
                        }
                    )
                    const requestCreateStockStore = dbOpenRequest.result.createObjectStore(
                        CONS.DB.STORES.STOCKS.NAME,
                        {
                            keyPath: CONS.DB.STORES.STOCKS.FIELDS.ID,
                            autoIncrement: true
                        }
                    )
                    requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER, {unique: true})
                    requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k1`, CONS.DB.STORES.BOOKINGS.FIELDS.DATE, {unique: false})
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k2`, CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k3`, CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k4`, CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk1`, CONS.DB.STORES.STOCKS.FIELDS.ISIN, {unique: true})
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk2`, CONS.DB.STORES.STOCKS.FIELDS.SYMBOL, {unique: true})
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k1`, CONS.DB.STORES.STOCKS.FIELDS.FADE_OUT, {unique: false})
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k2`, CONS.DB.STORES.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k3`, CONS.DB.STORES.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
                }
                // const updateDB = (): void => {
                //   log('BACKGROUND: onInstall: onUpgradeNeeded: updateDB')
                //   // const optFalse: IDBIndexParameters = {unique: false}
                //   // const onSuccessStocks = (ev: TIDBRequestEvent): void => {
                //   //   log(
                //   //     'BACKGROUND: onInstall: onUpgradeNeeded: createDB: onSuccessStocks'
                //   //   )
                //   //   const cursor: IDBCursorWithValue | null = ev.target.result
                //   //   if (cursor !== null) {
                //   //     const stock: IStock = cursor.value
                //   //     cursor.update(migrateStock({...stock}))
                //   //     cursor.continue()
                //   //   } else {
                //   //     stocksOpenCursorRequest?.removeEventListener(
                //   //       CONS.EVENTS.SUC,
                //   //       onSuccessStocks,
                //   //       false
                //   //     )
                //   //     const onSuccessTransfers = (ev: TIDBRequestEvent): void => {
                //   //       log(
                //   //         'BACKGROUND: onUpgradeNeeded: fCreateDB: onSuccessTransfers'
                //   //       )
                //   //       const cursor: IDBCursorWithValue | null = ev.target.result
                //   //       if (cursor !== null) {
                //   //         const transfer: ITransfer = cursor.value
                //   //         cursor.update(migrateTransfer({...transfer}))
                //   //         cursor.continue()
                //   //       } else {
                //   //         stocksOpenCursorRequest?.removeEventListener(
                //   //           CONS.EVENTS.SUC,
                //   //           onSuccessTransfers,
                //   //           false
                //   //         )
                //   //       }
                //   //     }
                //   //     if (dbOpenRequest?.transaction === null) {
                //   //       console.error('BACKGROUND: open database error')
                //   //     } else if (
                //   //       !dbOpenRequest.transaction
                //   //         ?.objectStore(CONS.DB.STORES.S)
                //   //         .indexNames.contains('stocks_k2')
                //   //     ) {
                //   //       dbOpenRequest.transaction
                //   //         ?.objectStore(CONS.DB.STORES.S)
                //   //         .createIndex('stocks_k2', 'cFadeOut', optFalse)
                //   //     }
                //   //     const requestTransfersOpenCursor:
                //   //       | IDBRequest<IDBCursorWithValue | null>
                //   //       | undefined = dbOpenRequest.transaction?.objectStore(CONS.DB.STORES.T).openCursor()
                //   //     requestTransfersOpenCursor?.addEventListener(
                //   //       CONS.EVENTS.SUC,
                //   //       onSuccessTransfers,
                //   //       false
                //   //     )
                //   //   }
                //   // }
                //   // const onErrorStocks = (err: ErrorEvent): void => {
                //   //   stocksOpenCursorRequest?.removeEventListener(
                //   //     CONS.EVENTS.ERR,
                //   //     onError,
                //   //     false
                //   //   )
                //   //   console.error(err.message)
                //   // }
                //   // const stocksOpenCursorRequest:
                //   //   | IDBRequest<IDBCursorWithValue | null>
                //   //   | undefined = dbOpenRequest?.transaction?.objectStore(CONS.DB.STORES.S).openCursor()
                //   // stocksOpenCursorRequest?.addEventListener(
                //   //   CONS.EVENTS.ERR,
                //   //   onErrorStocks,
                //   //   false
                //   // )
                //   // stocksOpenCursorRequest?.addEventListener(
                //   //   CONS.EVENTS.SUC,
                //   //   onSuccessStocks,
                //   //   false
                //   // )
                //   // for (
                //   //   let i = 0;
                //   //   i < dbOpenRequest.result.objectStoreNames.length;
                //   //   i++
                //   // ) {
                //   //   if (
                //   //     dbOpenRequest.result.objectStoreNames[i] !== CONS.DB.STORES.S &&
                //   //     dbOpenRequest.result.objectStoreNames[i] !== CONS.DB.STORES.T
                //   //   ) {
                //   //     dbOpenRequest.result.deleteObjectStore(
                //   //       dbOpenRequest.result.objectStoreNames[i]
                //   //     )
                //   //   }
                //   // }
                // }
                // const updateStorageLocal = async () => {
                //   const storageKeys = Object.keys(CONS.DEFAULTS.STORAGE)
                //   const storageValues = Object.values(CONS.DEFAULTS.STORAGE)
                //   const storage: IStorageLocal = await browser.storage.local.get(storageKeys)
                //   for (let i = 0; i < storageKeys.length; i++) {
                //     if (storage[storageKeys[i]] === undefined) {
                //       await browser.storage.local.set({
                //         [storageKeys[i]]: storageValues[i]
                //       })
                //     }
                //   }
                // }
                //
                if (ev.oldVersion === 0) {
                    createDB()
                } else if (ev.oldVersion > 25) {
                    // updateDB()
                }
                await installStorageLocal()
            }
        }
        const dbOpenRequest: IDBOpenDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION)
        dbOpenRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
        dbOpenRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
        dbOpenRequest.addEventListener(CONS.EVENTS.UPG, onUpgradeNeeded, CONS.SYSTEM.ONCE)
    }
    const onClick = async (): Promise<void> => {
        log('BACKGROUND: onClick')
        await open()
        const foundTabs = await browser.tabs.query({url: `${browser.runtime.getURL(CONS.SYSTEM.INDEX)}`})
        // NOTE: any async webextension API call which triggers a corresponding event listener will reload background.js.
        if (foundTabs.length === 0) {
            const extensionTab = await browser.tabs.create({
                url: browser.runtime.getURL(CONS.SYSTEM.INDEX),
                active: true
            })
            const extensionTabIdStr = (extensionTab.id ?? -1).toString()
            sessionStorage.setItem('sExtensionTabId', extensionTabIdStr)
        } else {
            await browser.windows.update(foundTabs[0].windowId ?? 0, {
                focused: true
            })
            await browser.tabs.update(foundTabs[0].id ?? 0, {active: true})
        }
    }
    const onAppMessage = async (appMsg: string): Promise<string> => {
        log('BACKGROUND: onAppMessage', {info: appMsg})
        return new Promise(async (resolve, reject) => {
            const appMessage = JSON.parse(appMsg)
            let response: string
            switch (appMessage.type) {
                // case CONS.MESSAGES.STORAGE__GET_ALL:
                //     const storageLocal1 = await browser.storage.local.get()
                //     response = JSON.stringify({
                //         type: CONS.MESSAGES.STORAGE__GET_ALL__RESPONSE,
                //         data: storageLocal1
                //     })
                //     resolve(response)
                //     break
                // case CONS.MESSAGES.DB__CLOSE:
                //     if (dbi() !== undefined) {
                //         dbi().close()
                //         resolve('DB closed')
                //     } else {
                //         resolve('No DB open')
                //     }
                //     break
                case CONS.MESSAGES.DB__DELETE_ALL:
                    await clearStores()
                    resolve('DB empty')
                    break
                case CONS.MESSAGES.DB__EXPORT:
                    await exportToFile(appMessage.data)
                    resolve('DB exported')
                    break
                // case CONS.MESSAGES.STORAGE__SET_ID:
                //     await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: appMessage.data})
                //     //await exportStores()
                //     resolve('ID set')
                //     break
                case CONS.MESSAGES.DB__GET_STORES:
                    const stores = await exportStores(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__GET_STORES__RESPONSE,
                        data: stores
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__ADD_STORES_25:
                    const importStoresData25: IStores = appMessage.data
                    await importStores(importStoresData25, false)
                    await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData25.accounts[0].cID})
                    resolve('Stores added')
                    break
                case CONS.MESSAGES.DB__ADD_STORES:
                    const importStoresData: IStores = appMessage.data
                    await importStores(importStoresData)
                    await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData.accounts[0].cID})
                    resolve('Stores added')
                    break
                case CONS.MESSAGES.DB__ADD_ACCOUNT:
                    const addAccountData: Omit<IAccount, 'cID'> = appMessage.data
                    const addAccountID = await addAccount(addAccountData)
                    if (typeof addAccountID === 'number') {
                        const completeAccount: IAccount = {cID: addAccountID, ...addAccountData}
                        response = JSON.stringify({
                            //type: CONS.MESSAGES.DB__ADD_ACCOUNT__RESPONSE,
                            data: completeAccount
                        })
                        await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: addAccountID})
                        resolve(response)
                    }
                    break
                case CONS.MESSAGES.DB__ADD_BOOKING:
                    const addBookingData: Omit<IBooking, 'cID'> = appMessage.data
                    const addBookingID = await addBooking(addBookingData)
                    if (typeof addBookingID === 'number') {
                        const completeBooking: IBooking = {cID: addBookingID, ...addBookingData}
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_BOOKING__RESPONSE,
                            data: completeBooking
                        })
                        resolve(response)
                    }
                    break
                case CONS.MESSAGES.DB__ADD_BOOKING_TYPE:
                    const addBookingTypeData: Omit<IBookingType, 'cID'> = appMessage.data
                    const addBookingTypeID = await addBookingType(addBookingTypeData)
                    if (typeof addBookingTypeID === 'number') {
                        const completeBookingType: IBookingType = {cID: addBookingTypeID, ...addBookingTypeData}
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_BOOKING_TYPE__RESPONSE,
                            data: completeBookingType
                        })
                        resolve(response)
                    }
                    break
                case CONS.MESSAGES.DB__ADD_STOCK:
                    const addStockData: Omit<IStock, 'cID'> = appMessage.data
                    const addStockID = await addStock(addStockData)
                    if (typeof addStockID === 'number') {
                        const completeStock: IStock = {cID: addStockID, ...addStockData}
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_STOCK__RESPONSE,
                            data: completeStock
                        })
                        resolve(response)
                    } else {
                        reject('Wrong ID type')
                    }
                    break
                case CONS.MESSAGES.DB__UPDATE_ACCOUNT:
                    await updateAccount(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_ACCOUNT__RESPONSE
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__UPDATE_STOCK:
                    const updateStockResponse = await updateStock(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_STOCK__RESPONSE,
                        data: updateStockResponse
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__UPDATE_BOOKING:
                    const updateBookingResponse = await updateBooking(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_BOOKING__RESPONSE,
                        data: updateBookingResponse
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__DELETE_ACCOUNT:
                    await deleteAccount(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__DELETE_STOCK:
                    await deleteStock(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_STOCK__RESPONSE
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__DELETE_BOOKING:
                    await deleteBooking(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.DB__DELETE_BOOKING_TYPE:
                    await deleteBookingType(appMessage.data)
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_BOOKING_TYPE__RESPONSE
                    })
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__MIN_RATE_MAX_DATA:
                    const fetchedMinRateMaxData: FetchedResources.IMinRateMaxData[] = await fetchMinRateMaxData(appMessage.data)
                    response = JSON.stringify({data: fetchedMinRateMaxData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__COMPANY_DATA:
                    const fetchedCompanyData: FetchedResources.ICompanyData = await fetchCompanyData(appMessage.data)
                    response = JSON.stringify({data: fetchedCompanyData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__EXCHANGES_BASE_DATA:
                    const fetchedExchangesBaseData: FetchedResources.IExchangesData[] = await fetchExchangesData(appMessage.data)
                    response = JSON.stringify({data: fetchedExchangesBaseData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__EXCHANGES_DATA:
                    const fetchedExchangesData: FetchedResources.IExchangesData[] = await fetchExchangesData(appMessage.data)
                    response = JSON.stringify({data: fetchedExchangesData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__MATERIALS_DATA:
                    const fetchedMaterialsData: FetchedResources.IMaterialData[] = await fetchMaterialData()
                    response = JSON.stringify({data: fetchedMaterialsData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__INDEXES_DATA:
                    const fetchedIndexesData: FetchedResources.IMaterialData[] = await fetchIndexData()
                    response = JSON.stringify({data: fetchedIndexesData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__DATES_DATA:
                    const fetchedDatesData: FetchedResources.IDatesData = await fetchDateData(appMessage.data)
                    response = JSON.stringify({data: fetchedDatesData})
                    resolve(response)
                    break
                case CONS.MESSAGES.FETCH__DAILY_CHANGES_DATA:
                    const fetchedDailyChangesData: FetchedResources.IDailyChangesData[] = await fetchDailyChangeData(appMessage.data)
                    response = JSON.stringify({data: fetchedDailyChangesData})
                    resolve(response)
                    break
                default:
                    console.error('Missing message type')
                    reject('Missing message type')
            }
        })
    }

    browser.runtime.onInstalled.addListener(onInstall)
    browser.action.onClicked.addListener(onClick)
    browser.runtime.onMessage.addListener(onAppMessage)

    log('--- PAGE_SCRIPT background.js ---', {info: window.document.location.href})
}

log('--- PAGE_SCRIPT background.js ---')
