/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { StorageDataType } from "@/types";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES
} from "@/domains/errors";
import { BROWSER_STORAGE } from "@/domains/config/storage";

/**
 * Composable providing access to browser local storage.
 * Wraps storage operations with error handling and provides a listener for changes.
 *
 * @module composables/useStorage
 */
export function useStorage() {
  /**
   * Clears all data from local browser storage.
   */
  async function clearStorage(): Promise<void> {
    try {
      await browser.storage.local.clear();
    } catch {
      throw new AppError(
        ERROR_CODES.USE_STORAGE.A,
        ERROR_CATEGORY.VALIDATION,
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
    value: string | number | boolean | string[]
  ): Promise<void> {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch {
      throw new AppError(
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
      return await browser.storage.local.get(keys);
    } catch {
      throw new AppError(
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
   * Initializes local storage with default values if they are missing.
   */
  async function installStorageLocal(): Promise<void> {
    try {
      const storageLocal = await browser.storage.local.get();
      const updates: Record<string, string | number | boolean | string[]> = {};

      // Collect all missing keys
      for (const value of Object.values(BROWSER_STORAGE)) {
        if (storageLocal[value.key] === undefined) {
          updates[value.key] = value.value;
        }
      }

      // Batch update if there are any missing keys
      if (Object.keys(updates).length > 0) {
        await browser.storage.local.set(updates);
      }
    } catch {
      throw new AppError(
        ERROR_CODES.USE_STORAGE.D,
        ERROR_CATEGORY.VALIDATION,
        true
      );
    }
  }

  /**
   * Stores a single value in session browser storage.
   * @param key - The storage key.
   * @param value - The value to store.
   */

  return {
    clearStorage,
    getStorage,
    setStorage,
    addStorageChangedListener,
    installStorageLocal
  };
}
