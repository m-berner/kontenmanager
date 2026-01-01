/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {I_Storage_Local, T_Storage} from '@/types'
import {computed} from 'vue'
import {useAppConfig} from '@/composables/useAppConfig'

const {BROWSER_STORAGE, EVENTS, PAGES} = useAppConfig()

export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(PAGES.INDEX))
    const manifest = computed(() => browser.runtime.getManifest())
    const uiLanguage = computed(() => browser.i18n.getUILanguage())
    const locale5 = computed(() => {
        const defaultLanguage = navigator.languages[0]
        let result = ''
        if (defaultLanguage.length === 5) {
            result = defaultLanguage
        } else if (defaultLanguage.length === 2) {
            result = `${defaultLanguage}-${defaultLanguage.toUpperCase()}`
        } else {
            throw new Error('Could not read the browser language!')
        }
        return result
    })

    function actionOnClicked(listener: ((_tab: browser.tabs.Tab, _info?: browser.action.OnClickData | undefined) => void)): void {
        // noinspection JSDeprecatedSymbols
        browser.action.onClicked.addListener(listener)
    }

    function runtimeOnInstalled(listener: (_details: browser.runtime._OnInstalledDetails | undefined) => Promise<void>): void {
        // noinspection JSDeprecatedSymbols
        browser.runtime.onInstalled.addListener(listener)
    }

    async function clearStorage() {
        await browser.storage.local.clear()
    }

    async function tabsCreate() {
        return await browser.tabs.create(
            {
                url: indexUrl.value,
                active: true
            }
        )
    }

    async function tabsQuery() {
        return await browser.tabs.query({url: indexUrl.value})
    }

    async function windowsUpdate(wId: number | undefined) {
        return await browser.windows.update(wId ?? 0, {
            focused: true
        })
    }

    async function tabsUpdate(id: number | undefined) {
        return await browser.tabs.update(id ?? 0, {
            active: true
        })
    }

    async function setStorage(key: string, value: string | number | boolean | string[]): Promise<void> {
        try {
            await browser.storage.local.set({[key]: value})
        } catch (error) {
            throw error
        }
    }

    async function getStorage(keys: string[] | null = null): Promise<T_Storage> {
        try {
            return await browser.storage.local.get(keys)
        } catch (error) {
            throw error
        }
    }

    function addStorageChangedListener(callback: (_changes: Record<string, browser.storage.StorageChange>) => void) {
        // noinspection JSDeprecatedSymbols
        browser.storage.local.onChanged.addListener(callback)
        // Return cleanup function
        // noinspection JSDeprecatedSymbols
        return () => browser.storage.local.onChanged.removeListener(callback)
    }

    async function installStorageLocal() {
        const defaultStorage: I_Storage_Local = Object.freeze({
            sActiveAccountId: BROWSER_STORAGE.ACTIVE_ACCOUNT_ID,
            sSkin: BROWSER_STORAGE.SKIN,
            sBookingsPerPage: BROWSER_STORAGE.BOOKINGS_PER_PAGE,
            sStocksPerPage: BROWSER_STORAGE.STOCKS_PER_PAGE,
            sDividendsPerPage: BROWSER_STORAGE.DIVIDENDS_PER_PAGE,
            sSumsPerPage: BROWSER_STORAGE.SUMS_PER_PAGE,
            sService: BROWSER_STORAGE.SERVICE,
            sExchanges: BROWSER_STORAGE.EXCHANGES,
            sIndexes: BROWSER_STORAGE.INDEXES,
            sMarkets: BROWSER_STORAGE.MARKETS,
            sMaterials: BROWSER_STORAGE.MATERIALS
        })
        const storageLocal = await browser.storage.local.get()
        if (storageLocal !== undefined) {
            for (const [key, value] of Object.entries(defaultStorage)) {
                if (storageLocal[key] === undefined) {
                    await browser.storage.local.set({[key]: value})
                }
            }
        }
        return storageLocal
    }

    async function openOptionsPage(): Promise<void> {
        try {
            return await browser.runtime.openOptionsPage()
        } catch (error) {
            throw error
        }
    }

    async function notice(messages: string[]): Promise<void> {
        const msg = messages.join('\n')
        const notificationOption: browser.notifications.CreateNotificationOptions =
            {
                type: 'basic',
                iconUrl: 'assets/icon16.png',
                title: 'KontenManager',
                message: msg
            }
        await browser.notifications.create(notificationOption)
    }

    async function writeBufferToFile(buffer: string, fn: string): Promise<void> {
        const blob = new Blob([buffer], {type: 'application/json'}) // create blob object with all stores data
        const blobUrl = URL.createObjectURL(blob) // create url reference for blob object
        const op: browser.downloads._DownloadOptions = {
            url: blobUrl,
            filename: fn
        }
        await browser.downloads.download(op) // writing blob object into download file
        await notice(['Database exported!'])
        const onDownloadChange = (change: browser.downloads._OnChangedDownloadDelta): void => {
            if ((change.state !== undefined && change.id > 0) || (change.state !== undefined && change.state.current === EVENTS.COMPLETE)) {
                URL.revokeObjectURL(blobUrl) // release blob object
                // noinspection JSDeprecatedSymbols
                browser.downloads.onChanged.removeListener(onDownloadChange)
            }
        }
        // noinspection JSDeprecatedSymbols
        browser.downloads.onChanged.addListener(onDownloadChange) // listener to clean up the blob object after the download.
    }

    return {
        locale5,
        manifest,
        uiLanguage,
        actionOnClicked,
        runtimeOnInstalled,
        clearStorage,
        getStorage,
        setStorage,
        installStorageLocal,
        notice,
        addStorageChangedListener,
        openOptionsPage,
        tabsCreate,
        tabsQuery,
        tabsUpdate,
        windowsUpdate,
        writeBufferToFile
    }
}
