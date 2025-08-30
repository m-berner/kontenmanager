/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

export const useBrowser = () => {
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
    const onStorageChanged = (callback: (_changes: browser.storage.StorageChange) => void) => {
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

    return {getChar5Locale, getStorage, setStorage, onStorageChanged, openOptionsPage}
}
