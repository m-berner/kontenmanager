/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {BROWSER_STORAGE, ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import type {StorageDataType, StorageValueType} from "@/domain/types";

/**
 * Service providing access to browser local storage.
 * Wraps storage operations with error handling and provides a listener for changes.
 */
export function storageAdapter() {
    /**
     * Normalizes the provided storage value to ensure it adheres to the expected storage format.
     */
    function normalizeDefaultStorageValue(value: unknown): StorageValueType {
        if (Array.isArray(value)) {
            return [...value] as string[];
        }
        return value as StorageValueType;
    }

    /**
     * Clears all data stored in the browser's local storage.
     */
    async function clearStorage(): Promise<void> {
        try {
            await browser.storage.local.clear();
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.A.CODE,
                ERROR_CATEGORY.STORAGE_API,
                true,
                {originalError: serializeError(err)}
            );
        }
    }

    /**
     * Stores a single value in local browser storage.
     */
    async function setStorage(key: string, value: StorageValueType): Promise<void> {
        try {
            await browser.storage.local.set({[key]: value});
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.B.CODE,
                ERROR_CATEGORY.STORAGE_API,
                true,
                {key, originalError: serializeError(err)}
            );
        }
    }

    /**
     * Retrieves values from local browser storage.
     */
    async function getStorage(keys: string[] | null = null): Promise<StorageDataType> {
        try {
            return await browser.storage.local.get(keys) as StorageDataType;
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.C.CODE,
                ERROR_CATEGORY.STORAGE_API,
                true,
                {keys, originalError: serializeError(err)}
            );
        }
    }

    /**
     * Adds a listener for storage changes.
     */
    function addStorageChangedListener(
        callback: (
            _changes: Record<string, browser.storage.StorageChange>,
            _areaName: string
        ) => void
    ): () => void {
        // Filter to only local storage changes.
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
     * Ensures that all required keys in local storage are initialized.
     */
    async function installStorageLocal(): Promise<void> {
        try {
            const storageLocal = await browser.storage.local.get();
            const updates: Record<string, StorageValueType> = {};

            // Collect all missing keys.
            for (const value of Object.values(BROWSER_STORAGE)) {
                if (storageLocal[value.key] === undefined) {
                    updates[value.key] = normalizeDefaultStorageValue(value.value);
                }
            }

            if (Object.keys(updates).length > 0) {
                await browser.storage.local.set(updates);
            }
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.USE_STORAGE.D.CODE,
                ERROR_CATEGORY.STORAGE_API,
                true,
                {originalError: serializeError(err)}
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
