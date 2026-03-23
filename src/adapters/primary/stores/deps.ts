/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

// Central dependency injection point for Pinia stores.
// Stores should not import services directly to avoid tight coupling and cycles.

import {getActivePinia, type Pinia} from "pinia";

import type {HandleUserAlertOptions, StorageDataType, StorageValueType} from "@/domain/types";

type StorageAdapterApi = {
    clearStorage: () => Promise<void>;
    getStorage: (_keys?: string[] | null) => Promise<StorageDataType>;
    setStorage: (_key: string, _value: StorageValueType) => Promise<void>;
    addStorageChangedListener: (
        _callback: (
            _changes: Record<string, browser.storage.StorageChange>,
            _areaName: string
        ) => void
    ) => () => void;
    installStorageLocal: () => Promise<void>;
};

type AlertAdapterLike = {
    feedbackInfo?: (
        _title: string,
        _msg: unknown,
        _options?: HandleUserAlertOptions
    ) => Promise<unknown> | unknown;
    feedbackWarning?: (
        _title: string,
        _msg: unknown,
        _options?: HandleUserAlertOptions
    ) => Promise<unknown> | unknown;
    feedbackConfirm?: (
        _title: string,
        _msg: unknown,
        _options?: HandleUserAlertOptions
    ) => Promise<unknown> | unknown;
    feedbackError: (
        _title: string,
        _msg: unknown,
        _options: HandleUserAlertOptions
    ) => Promise<unknown> | unknown;
};

type StoreDeps = {
    storageAdapter: () => StorageAdapterApi;
    alertAdapter: AlertAdapterLike;
};

const STORE_DEPS_KEY: unique symbol = Symbol("kontenmanager.storeDeps");

export function attachStoreDeps(pinia: Pinia, next: StoreDeps): void {
    (pinia as unknown as Record<symbol, unknown>)[STORE_DEPS_KEY] = next;
}

export function getStoreDeps(): StoreDeps {
    const pinia = getActivePinia();
    const deps = pinia
        ? (pinia as unknown as Record<symbol, unknown>)[STORE_DEPS_KEY]
        : undefined;

    if (!deps) {
        throw new Error(
            "Store dependencies are not configured for the active Pinia instance. " +
            "Call attachStoreDeps(pinia, ...) before using stores."
        );
    }
    return deps as StoreDeps;
}

// Per-store dependency accessors. Stores should use these instead of getStoreDeps()
// so they only "see" what they actually depend on.

export function getSettingsStoreDeps(): StoreDeps {
    return getStoreDeps();
}

