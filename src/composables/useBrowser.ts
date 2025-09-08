/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useConstant} from '@/composables/useConstant'

export const useBrowser = () => {

    const clearStorage = async () => {
        await browser.storage.local.clear()
    }
    const setStorage = async (key: string, value: string | number | boolean | string[]): Promise<void> => {
        try {
            await browser.storage.local.set({[key]: value})
        } catch (error) {
            throw error
        }
    }
    const getStorage = async (keys: string[] | null = null): Promise<{
        [p: string]: string | boolean | number | string[]
    }> => {
        try {
            return await browser.storage.local.get(keys)
        } catch (error) {
            throw error
        }
    }
    const openOptionsPage = async (): Promise<void> => {
        try {
            return await browser.runtime.openOptionsPage()
        } catch (error) {
            throw error
        }
    }
    const onStorageChanged = (callback: (_changes: { [key: string]: browser.storage.StorageChange }) => void) => {
        browser.storage.local.onChanged.addListener(callback)
        // Return cleanup function
        return () => browser.storage.local.onChanged.removeListener(callback)
    }
    const getChar5Locale = (): string => {
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
    }
    const installStorageLocal = async () => {
        const {CONS} = useConstant()
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

    return {
        clearStorage,
        getChar5Locale,
        getStorage,
        setStorage,
        installStorageLocal,
        onStorageChanged,
        openOptionsPage
    }
}
