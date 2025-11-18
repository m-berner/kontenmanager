/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {TStorageChange} from '@/types.d'
import {useApp} from '@/composables/useApp'
import {computed} from 'vue'

const {CONS} = useApp()

export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(CONS.PAGES.INDEX))
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

    function actionOnClicked(listener: (() => Promise<void>)): void {
        browser.action.onClicked.addListener(listener)
    }

    function runtimeOnInstalled(listener: (() => Promise<void>)): void {
        browser.runtime.onInstalled.addListener(listener)
    }

    async function clearStorage() {
        await browser.storage.local.clear()
    }

    async function tabsCreate() {
        return await browser.tabs.create({
            url: indexUrl.value,
            active: true
        })
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

    async function getStorage(keys: string[] | null = null): Promise<{
        [p: string]: string | boolean | number | string[]
    }> {
        try {
            return await browser.storage.local.get(keys)
        } catch (error) {
            throw error
        }
    }

    async function addStorageChangedListener(callback: (_changes: TStorageChange) => void) {
        browser.storage.local.onChanged.addListener(callback)
        // Return cleanup function
        return () => browser.storage.local.onChanged.removeListener(callback)
    }

    async function installStorageLocal() {
        const storageLocal = await browser.storage.local.get()
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN]: CONS.DEFAULTS.BROWSER_STORAGE.SKIN})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: CONS.DEFAULTS.BROWSER_STORAGE.ACTIVE_ACCOUNT_ID})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.CATEGORIES_PER_PAGE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.CATEGORIES_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.CATEGORIES_PER_PAGE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUM_PER_PAGE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUM_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.CATEGORIES_PER_PAGE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.PARTNER] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.PARTNER]: CONS.DEFAULTS.BROWSER_STORAGE.PARTNER})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE]: CONS.DEFAULTS.BROWSER_STORAGE.SERVICE})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES]: CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES]: CONS.DEFAULTS.BROWSER_STORAGE.INDEXES})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS]: CONS.DEFAULTS.BROWSER_STORAGE.MARKETS})
        }
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS] === undefined) {
            await browser.storage.local.set({[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS]: CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS})
        }
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
            if ((change.state !== undefined && change.id > 0) || (change.state !== undefined && change.state.current === CONS.EVENTS.COMPLETE)) {
                URL.revokeObjectURL(blobUrl) // release blob object
                browser.downloads.onChanged.removeListener(onDownloadChange)
            }
        }
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
