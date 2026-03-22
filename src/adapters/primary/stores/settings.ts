/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {type Ref, ref} from "vue";

import {BROWSER_STORAGE} from "@/domain/constants";
import type {StorageDataType, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {getSettingsStoreDeps} from "@/adapters/primary/stores/deps";

/**
 * Pinia store for user-specific application settings and preferences.
 *
 * This store manages UI themes, pagination limits, active account selection,
 * and persistent filter configurations. All state mutations are automatically
 * synchronized with the browser's persistent storage.
 *
 * @module stores/settings
 * @returns Reactive settings state, computed aggregations,
 * and methods to mutate and enrich settings data.
 */
export const useSettingsStore = defineStore(
    "settings" /**
     * A composable function for managing application settings and preferences.
     * Leverages browser storage for persistence and synchronizes changes across contexts.
     *
     * @returns A set of reactive state variables and methods for interacting
     *                   with user settings and preferences.
     *
     * @property {Ref<string>} skin - Currently active UI skin or theme name.
     * @property {Ref<number>} bookingsPerPage - Number of booking records displayed per table page.
     * @property {Ref<number>} stocksPerPage - Number of stock records displayed per table page.
     * @property {Ref<number>} dividendsPerPage - Number of dividend records displayed per table page.
     * @property {Ref<number>} sumsPerPage - Number of summary/total records displayed per table page.
     * @property {Ref<number>} activeAccountId - Identifier of the currently selected bank account.
     *                                           Default value is -1 if no account is selected.
     * @property {Ref<string>} service - Key of the external financial service used for data fetching.
     * @property {Ref<string[]>} materials - List of enabled/visible material categories.
     * @property {Ref<string[]>} markets - List of enabled/visible stock market identifiers.
     * @property {Ref<string[]>} indexes - List of enabled/visible financial indexes.
     * @property {Ref<string[]>} exchanges - List of enabled/visible stock exchange identifiers.
     *
     * @property {Function} init - Initializes the store with values retrieved from browser storage.
     *                             Also sets up a listener for cross-context storage synchronization.
     *
     * @property {Function} setSumsPerPage - Updates the page limit for summary tables.
     * @property {Function} setBookingsPerPage - Updates the page limit for booking tables.
     * @property {Function} setStocksPerPage - Updates the page limit for stock tables.
     * @property {Function} setDividendsPerPage - Updates the page limit for dividend tables.
     * @property {Function} setActiveAccountId - Switches the currently active bank account.
     */,
    function () {
        const {storageAdapter, alertService} = getSettingsStoreDeps();
        const {getStorage, setStorage, addStorageChangedListener} = storageAdapter();
        let removeStorageChangeListener: (() => void) | null = null;

        /** Currently active UI skin or theme name. */
        const skin = ref<string>(BROWSER_STORAGE.SKIN.value);

        /** Number of booking records displayed per table page. */
        const bookingsPerPage = ref<number>(
            BROWSER_STORAGE.BOOKINGS_PER_PAGE.value
        );

        /** Number of stock records displayed per table page. */
        const stocksPerPage = ref<number>(BROWSER_STORAGE.STOCKS_PER_PAGE.value);

        /** Number of dividend records displayed per table page. */
        const dividendsPerPage = ref<number>(
            BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value
        );

        /** Number of summary/total records displayed per table page. */
        const sumsPerPage = ref<number>(BROWSER_STORAGE.SUMS_PER_PAGE.value);

        /**
         * Identifier of the currently selected bank account.
         * A value of -1 indicates no account is selected.
         */
        const activeAccountId = ref<number>(-1);

        /** Key of the external financial service used for data fetching. */
        const service = ref<string>(BROWSER_STORAGE.SERVICE.value);

        /** List of enabled/visible material categories. */
        const materials = ref<string[]>([...BROWSER_STORAGE.MATERIALS.value]);

        /** List of enabled/visible stock market identifiers. */
        const markets = ref<string[]>([...BROWSER_STORAGE.MARKETS.value]);

        /** List of enabled/visible financial indexes. */
        const indexes = ref<string[]>([...BROWSER_STORAGE.INDEXES.value]);

        /** List of enabled/visible stock exchange identifiers. */
        const exchanges = ref<string[]>([...BROWSER_STORAGE.EXCHANGES.value]);

        /**
         * Creates a shallow copy of the provided storage value. If the value is an array,
         * it returns a new array containing the elements of the original array. Otherwise,
         * it returns the value unchanged.
         *
         * @param value - The storage value to be cloned. Can be any type that extends StorageValueType.
         * @returns A shallow copy of the provided storage value.
         */
        function cloneStorageValue<T extends StorageValueType>(value: T): T {
            if (Array.isArray(value)) {
                return [...value] as T;
            }
            return value;
        }

        /**
         * Synchronizes a specified reactive reference with a value from a storage object.
         *
         * @param target - The reactive reference to synchronize.
         * @param storage - The storage object containing the values.
         * @param key - The key in the storage object whose value should be synchronized.
         * @param fallback
         */
        function syncFromStorage<T extends StorageValueType>(
            target: Ref<T>,
            storage: StorageDataType,
            key: string,
            fallback: T
        ): void {
            const raw = storage[key as keyof StorageDataType] as T | undefined;
            target.value = cloneStorageValue(raw ?? fallback);
        }

        /**
         * Applies changes from a storage event to a specific key in the target reference and executes an optional callback.
         *
         * @param changes - A record of storage changes keyed by storage keys.
         * @param key - The specific key whose value needs to be updated in the target reference.
         * @param target - A reference that will be updated with the new value from storage.
         * @param fallback
         * @param onChange - An optional callback to be executed with the new value after applying the change.
         */
        function applyStorageChange<T extends StorageValueType>(
            changes: Record<string, browser.storage.StorageChange>,
            key: string,
            target: Ref<T>,
            fallback: T,
            onChange?: (_value: T) => void
        ): void {
            const change = changes[key];
            if (!change) return;

            const raw = change.newValue as T | undefined;
            const nextValue = cloneStorageValue(raw ?? fallback);
            target.value = nextValue;
            onChange?.(nextValue);
        }

        /**
         * Internal helper to update a state property and its corresponding browser storage entry.
         *
         * @param refVar - The reactive reference to update.
         * @param key - The key used in browser storage.
         * @param value - The new value to apply.
         */
        async function updateSetting<T extends StorageValueType>(
            refVar: Ref<T>,
            key: string,
            value: T
        ) {
            const prev = refVar.value;
            refVar.value = value;
            try {
                await setStorage(key, value);
            } catch (err) {
                refVar.value = prev;
                await alertService.feedbackError("STORES Settings", err, {});
            }
        }

        /**
         * Loads settings from browser storage and initializes the store.
         * Useful for contexts that don't run the full app bootstrap (e.g. options page).
         */
        async function load(): Promise<void> {
            try {
                const storage = await getStorage();
                init(storage);
            } catch (err) {
                await alertService.feedbackError("STORES Settings", err, {});
            }
        }

        /**
         * Initializes the store with values retrieved from browser storage.
         *
         * @param storage - Object containing all persisted settings.
         */
        function init(storage: StorageDataType): void {
            log("STORES settings: init");

            syncFromStorage(skin, storage, BROWSER_STORAGE.SKIN.key, BROWSER_STORAGE.SKIN.value);
            syncFromStorage(
                bookingsPerPage,
                storage,
                BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
                BROWSER_STORAGE.BOOKINGS_PER_PAGE.value
            );
            syncFromStorage(stocksPerPage, storage, BROWSER_STORAGE.STOCKS_PER_PAGE.key, BROWSER_STORAGE.STOCKS_PER_PAGE.value);
            syncFromStorage(
                dividendsPerPage,
                storage,
                BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
                BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value
            );
            syncFromStorage(sumsPerPage, storage, BROWSER_STORAGE.SUMS_PER_PAGE.key, BROWSER_STORAGE.SUMS_PER_PAGE.value);
            syncFromStorage(
                activeAccountId,
                storage,
                BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
                BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.value
            );
            syncFromStorage(service, storage, BROWSER_STORAGE.SERVICE.key, BROWSER_STORAGE.SERVICE.value);
            syncFromStorage(materials, storage, BROWSER_STORAGE.MATERIALS.key, [...BROWSER_STORAGE.MATERIALS.value]);
            syncFromStorage(markets, storage, BROWSER_STORAGE.MARKETS.key, [...BROWSER_STORAGE.MARKETS.value]);
            syncFromStorage(indexes, storage, BROWSER_STORAGE.INDEXES.key, [...BROWSER_STORAGE.INDEXES.value]);
            syncFromStorage(exchanges, storage, BROWSER_STORAGE.EXCHANGES.key, [...BROWSER_STORAGE.EXCHANGES.value]);

            // Start listening for external changes (cross-context sync)
            if (removeStorageChangeListener) {
                removeStorageChangeListener();
                removeStorageChangeListener = null;
            }

            removeStorageChangeListener = addStorageChangedListener((changes) => {
                log("STORES settings: cross-context sync");

                applyStorageChange(changes, BROWSER_STORAGE.SKIN.key, skin, BROWSER_STORAGE.SKIN.value);
                applyStorageChange(changes, BROWSER_STORAGE.SERVICE.key, service, BROWSER_STORAGE.SERVICE.value);
                applyStorageChange(changes, BROWSER_STORAGE.INDEXES.key, indexes, [...BROWSER_STORAGE.INDEXES.value]);
                applyStorageChange(changes, BROWSER_STORAGE.MARKETS.key, markets, [...BROWSER_STORAGE.MARKETS.value]);
                applyStorageChange(changes, BROWSER_STORAGE.MATERIALS.key, materials, [...BROWSER_STORAGE.MATERIALS.value]);
                applyStorageChange(changes, BROWSER_STORAGE.EXCHANGES.key, exchanges, [...BROWSER_STORAGE.EXCHANGES.value]);
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
                    activeAccountId,
                    BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.value
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
                    bookingsPerPage,
                    BROWSER_STORAGE.BOOKINGS_PER_PAGE.value
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.STOCKS_PER_PAGE.key,
                    stocksPerPage,
                    BROWSER_STORAGE.STOCKS_PER_PAGE.value
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
                    dividendsPerPage,
                    BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.SUMS_PER_PAGE.key,
                    sumsPerPage,
                    BROWSER_STORAGE.SUMS_PER_PAGE.value
                );
            });
        }

        /**
         * Updates the page limit for summary tables.
         * @param v - New items per page limit.
         */
        async function setSumsPerPage(v: number): Promise<void> {
            await updateSetting(sumsPerPage, BROWSER_STORAGE.SUMS_PER_PAGE.key, v);
        }

        /**
         * Updates the page limit for booking tables.
         * @param v - New items per page limit.
         */
        async function setBookingsPerPage(v: number): Promise<void> {
            await updateSetting(
                bookingsPerPage,
                BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
                v
            );
        }

        /**
         * Updates the page limit for stock tables.
         * @param v - New items per page limit.
         */
        async function setStocksPerPage(v: number): Promise<void> {
            await updateSetting(
                stocksPerPage,
                BROWSER_STORAGE.STOCKS_PER_PAGE.key,
                v
            );
        }

        /**
         * Updates the page limit for dividend tables.
         * @param v - New items per page limit.
         */
        async function setDividendsPerPage(v: number): Promise<void> {
            await updateSetting(
                dividendsPerPage,
                BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
                v
            );
        }

        /**
         * Switches the currently active account.
         * @param id - The ID of the account to activate.
         */
        async function setActiveAccountId(id: number): Promise<void> {
            await updateSetting(
                activeAccountId,
                BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
                id
            );
        }

        /** Updates the active UI skin/theme. */
        async function setSkin(v: string): Promise<void> {
            await updateSetting(skin, BROWSER_STORAGE.SKIN.key, v);
        }

        /** Updates the active market data provider. */
        async function setService(v: string): Promise<void> {
            await updateSetting(service, BROWSER_STORAGE.SERVICE.key, v);
        }

        return {
            skin,
            bookingsPerPage,
            stocksPerPage,
            dividendsPerPage,
            sumsPerPage,
            activeAccountId,
            service,
            materials,
            markets,
            indexes,
            exchanges,
            load,
            init,
            setSkin,
            setSumsPerPage,
            setBookingsPerPage,
            setDividendsPerPage,
            setStocksPerPage,
            setActiveAccountId,
            setService
        };
    }
);

log("STORES settings");
