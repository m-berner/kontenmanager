/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StorageDataType, StorageValueType} from "@/types";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {BROWSER_STORAGE, ERROR_CATEGORY} from "@/constants";

/**
 * Domain providing access to browser local storage.
 * Wraps storage operations with error handling and provides a listener for changes.
 *
 * @module domains/storageAdapter
 */
export function storageAdapter() {
    /**
     * Normalizes the provided storage value to ensure it adheres to the expected storage format.
     *
     * @param value - The input value to be normalized. It may be of any type.
     * @returns Returns the normalized storage value, with arrays explicitly cast to string arrays if applicable.
     */
    function normalizeDefaultStorageValue(
        value: unknown
    ): StorageValueType {
        if (Array.isArray(value)) {
            return [...value] as string[];
        }
        return value as StorageValueType;
    }

    /**
     * Clears all data stored in the browser's local storage.
     *
     * This method removes all key-value pairs from the storage and handles errors
     * by throwing a custom application error if the operation fails.
     *
     * @returns A promise that resolves when the storage is successfully cleared.
     *                         Rejects with an application error if the operation encounters an issue.
     */
    async function clearStorage(): Promise<void> {
        try {
            await browser.storage.local.clear();
        } catch {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.A.CODE,
                ERROR_CATEGORY.STORAGE_API,
                true
            );
        }
    }

    /**
     * Stores a single value in local browser storage.
     * @param key - The storage key.
     * @param value - The value to store.
     */
    async function setStorage(
        key: string,
        value: StorageValueType //string | number | boolean | string[]
    ): Promise<void> {
        try {
            await browser.storage.local.set({[key]: value});
        } catch {
            throw appError(
                "xx_set_local_storage",
                ERROR_CATEGORY.STORAGE_API,
                true
            );
        }
    }

    /**
     * Retrieves values from local browser storage.
     * @param keys - Array of keys to retrieve, or null for all.
     * @returns A promise resolving to the retrieved data object.
     */
    async function getStorage(
        keys: string[] | null = null
    ): Promise<StorageDataType> {
        try {
            return await browser.storage.local.get(keys) as StorageDataType;
        } catch {
            throw appError(
                "xx_get_local_storage",
                ERROR_CATEGORY.STORAGE_API,
                true
            );
        }
    }

    /**
     * Adds a listener for storage changes.
     * @param callback - Function called when storage changes.
     * @returns Cleanup function to remove the listener.
     */
    function addStorageChangedListener(
        callback: (
            _changes: Record<string, browser.storage.StorageChange>,
            _areaName: string
        ) => void
    ): () => void {
        // Filter to only local storage changes
        const wrappedCallback = (
            changes: Record<string, browser.storage.StorageChange>,
            areaName: string
        ) => {
            if (areaName === "local") {
                callback(changes, areaName);
            }
        };

        browser.storage.onChanged.addListener(wrappedCallback);
        return () => browser.storage.onChanged.removeListener(wrappedCallback);
    }

    /**
     * Ensures that all required keys in the browser's local storage are initialized
     * with their respective default values if they are missing. Missing keys are collected
     * and updated in a single batch operation. In case of an error, a custom application
     * error is thrown.
     *
     * @async
     * @function installStorageLocal
     * @returns A promise that resolves when all required keys are initialized or rejects with an application error if an issue occurs.
     */
    async function installStorageLocal(): Promise<void> {
        try {
            const storageLocal = await browser.storage.local.get();
            const updates: Record<string, StorageValueType> = {};

            // Collect all missing keys
            for (const value of Object.values(BROWSER_STORAGE)) {
                if (storageLocal[value.key] === undefined) {
                    updates[value.key] = normalizeDefaultStorageValue(value.value);
                }
            }

            // Batch update if there are any missing keys
            if (Object.keys(updates).length > 0) {
                await browser.storage.local.set(updates);
            }
        } catch {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.D.CODE,
                ERROR_CATEGORY.VALIDATION,
                true
            );
        }
    }

    return {
        clearStorage,
        getStorage,
        setStorage,
        addStorageChangedListener,
        installStorageLocal
    };
}
