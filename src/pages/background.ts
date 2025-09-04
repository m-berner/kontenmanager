/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useConstant} from '@/composables/useConstant'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useNotification} from '@/composables/useNotification'

const {CONS} = useConstant()
const {log} = useNotification()

if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
    const {installStorageLocal} = useBrowser()
    const {getDB} = useIndexedDB()
    // NOTE: onInstall runs at the installation or update of the add-on. And it runs on firefox update.
    const onInstall = async (): Promise<void> => {
        log('BACKGROUND: onInstall')
        await installStorageLocal()
        const db = await getDB()
        db.close()
        // const onSuccess = (ev: Event): void => {
        //     if (ev.target instanceof IDBRequest) {
        //         ev.target.result.close()
        //     }
        //     log('BACKGROUND: onInstall: DONE')
        // }
        // const onError = (ev: Event): void => {
        //     log('BACKGROUND: onError: ', {error: ev})
        // }
        // const onUpgradeNeeded = async (ev: Event): Promise<void> => {
        //     if (ev instanceof IDBVersionChangeEvent) {
        //         log('BACKGROUND: onInstall: onUpgradeNeeded', {info: ev.newVersion})
        //         const createDB = (): void => {
        //             log('BACKGROUND: onInstall: onUpgradeNeeded: createDB')
        //             const requestCreateAccountStore = dbOpenRequest.result.createObjectStore(
        //                 CONS.DB.STORES.ACCOUNTS.NAME,
        //                 {
        //                     keyPath: CONS.DB.STORES.ACCOUNTS.FIELDS.ID,
        //                     autoIncrement: true
        //                 })
        //             const requestCreateBookingStore = dbOpenRequest.result.createObjectStore(
        //                 CONS.DB.STORES.BOOKINGS.NAME,
        //                 {
        //                     keyPath: CONS.DB.STORES.BOOKINGS.FIELDS.ID,
        //                     autoIncrement: true
        //                 }
        //             )
        //             const requestCreateBookingTypeStore = dbOpenRequest.result.createObjectStore(
        //                 CONS.DB.STORES.BOOKING_TYPES.NAME,
        //                 {
        //                     keyPath: CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID,
        //                     autoIncrement: true
        //                 }
        //             )
        //             const requestCreateStockStore = dbOpenRequest.result.createObjectStore(
        //                 CONS.DB.STORES.STOCKS.NAME,
        //                 {
        //                     keyPath: CONS.DB.STORES.STOCKS.FIELDS.ID,
        //                     autoIncrement: true
        //                 }
        //             )
        //             requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER, {unique: true})
        //             requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        //             requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k1`, CONS.DB.STORES.BOOKINGS.FIELDS.DATE, {unique: false})
        //             requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k2`, CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
        //             requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k3`, CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        //             requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k4`, CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
        //             requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk1`, CONS.DB.STORES.STOCKS.FIELDS.ISIN, {unique: true})
        //             requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk2`, CONS.DB.STORES.STOCKS.FIELDS.SYMBOL, {unique: true})
        //             requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k1`, CONS.DB.STORES.STOCKS.FIELDS.FADE_OUT, {unique: false})
        //             requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k2`, CONS.DB.STORES.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
        //             requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k3`, CONS.DB.STORES.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        //         }
        //         if (ev.oldVersion === 0) {
        //             createDB()
        //         } else if (ev.oldVersion > 25) {
        //             // updateDB()
        //         }
        //         await installStorageLocal()
        //     }
        // }
        // const dbOpenRequest: IDBOpenDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION)
        // dbOpenRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
        // dbOpenRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
        // dbOpenRequest.addEventListener(CONS.EVENTS.UPG, onUpgradeNeeded, CONS.SYSTEM.ONCE)
    }
    const onClick = async (): Promise<void> => {
        log('BACKGROUND: onClick')
        //await open()
        const foundTabs = await browser.tabs.query({url: `${browser.runtime.getURL(CONS.SYSTEM.INDEX)}`})
        // NOTE: An event listener called by an API reloads the background.js script.
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

    browser.runtime.onInstalled.addListener(onInstall)
    browser.action.onClicked.addListener(onClick)

    log('--- PAGE_SCRIPT background.js ---', {info: window.document.location.href})
}

log('--- PAGE_SCRIPT background.js (does nothing) ---')
