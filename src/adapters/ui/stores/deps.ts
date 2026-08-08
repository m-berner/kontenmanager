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

/**
 * Not exported: stores must go through a per-store accessor (below) so each
 * only "sees" what it depends on. Widening this to the module boundary invited
 * exactly the usage the accessors exist to prevent — ARCHITECTURE.md §8.3 was
 * still showing `getStoreDeps()` as the in-store pattern because of it.
 */
function getStoreDeps(): StoreDeps {
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

// Per-store dependency accessors. Stores use these instead of getStoreDeps() so
// each only "sees" what it actually depends on.
//
// The narrowing is now real. This comment previously described an isolation
// property the code did not provide: the accessor returned the **full**
// `StoreDeps` — `storageAdapter` *and* `alertAdapter` — identically to the
// private `getStoreDeps()` it was supposed to narrow, so a reader trusting it
// would believe the settings store could not reach `alertAdapter`, which it
// could and did. `RecordsPort`'s `Pick<AccountDb, "cID">`-style field narrowing
// (app/usecases/ports.ts) is the same idea applied properly, and was the model.
//
// The plural framing was also aspirational: there is exactly one accessor,
// because there is exactly one store that takes deps this way.

/**
 * Dependencies the settings store may reach.
 *
 * Both are genuinely used: `storageAdapter` for `getStorage`/`setStorage`, and
 * `alertAdapter` for `updateSetting`'s failure toast. Declaring the subset
 * explicitly is what makes the boundary checked rather than described — adding a
 * third adapter to `StoreDeps` no longer silently grants the settings store
 * access to it.
 */
export type SettingsStoreDeps = Pick<StoreDeps, "storageAdapter" | "alertAdapter">;

export function getSettingsStoreDeps(): SettingsStoreDeps {
    const {storageAdapter, alertAdapter} = getStoreDeps();
    return {storageAdapter, alertAdapter};
}

// Second, optional side-channel for translated strings shown by stores (e.g. alert
// titles, dialog defaults). Kept separate from StoreDeps/attachStoreDeps because the
// i18n instance is created after Pinia during app bootstrap (see entrypoints/app.ts),
// so it is wired in a second step once both are available.
const STORE_TRANSLATE_KEY: unique symbol = Symbol("kontenmanager.storeTranslate");

export type StoreTranslate = (_key: string) => string;

export function attachStoreTranslate(pinia: Pinia, translate: StoreTranslate): void {
    (pinia as unknown as Record<symbol, unknown>)[STORE_TRANSLATE_KEY] = translate;
}

export function getStoreTranslate(): StoreTranslate | undefined {
    const pinia = getActivePinia();
    const translate = pinia
        ? (pinia as unknown as Record<symbol, unknown>)[STORE_TRANSLATE_KEY]
        : undefined;
    return translate as StoreTranslate | undefined;
}

