/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StorageDataType, StorageValueType} from "@/types";
import type {Ref} from "vue";
import {ref} from "vue";
import {DomainUtils} from "@/domains/utils";
import {defineStore} from "pinia";
import {useStorage} from "@/composables/useStorage";
import {alertService} from "@/services/alert";
import {BROWSER_STORAGE} from "@/domains/configs/storage";
import {useTheme} from "vuetify";

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
     * @returns {object} A set of reactive state variables and methods for interacting
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
        const {setStorage, addStorageChangedListener} = useStorage();
        const theme = useTheme();

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

        function cloneStorageValue<T extends StorageValueType>(value: T): T {
            if (Array.isArray(value)) {
                return [...value] as T;
            }
            return value;
        }

        function syncFromStorage<K extends keyof StorageDataType>(
            target: Ref<StorageDataType[K]>,
            storage: StorageDataType,
            key: K
        ): void {
            target.value = cloneStorageValue(storage[key]);
        }

        function applyStorageChange<K extends keyof StorageDataType>(
            changes: Record<string, browser.storage.StorageChange>,
            key: K,
            target: Ref<StorageDataType[K]>,
            onChange?: (_value: StorageDataType[K]) => void
        ): void {
            const change = changes[key];
            if (!change) {
                return;
            }
            const nextValue = cloneStorageValue(change.newValue as StorageDataType[K]);
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
         * Initializes the store with values retrieved from browser storage.
         *
         * @param {StorageDataType} storage - Object containing all persisted settings.
         */
        function init(storage: StorageDataType): void {
            DomainUtils.log("STORES settings: init");

            syncFromStorage(skin, storage, BROWSER_STORAGE.SKIN.key);
            syncFromStorage(
                bookingsPerPage,
                storage,
                BROWSER_STORAGE.BOOKINGS_PER_PAGE.key
            );
            syncFromStorage(stocksPerPage, storage, BROWSER_STORAGE.STOCKS_PER_PAGE.key);
            syncFromStorage(
                dividendsPerPage,
                storage,
                BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key
            );
            syncFromStorage(sumsPerPage, storage, BROWSER_STORAGE.SUMS_PER_PAGE.key);
            syncFromStorage(
                activeAccountId,
                storage,
                BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key
            );
            syncFromStorage(service, storage, BROWSER_STORAGE.SERVICE.key);
            syncFromStorage(materials, storage, BROWSER_STORAGE.MATERIALS.key);
            syncFromStorage(markets, storage, BROWSER_STORAGE.MARKETS.key);
            syncFromStorage(indexes, storage, BROWSER_STORAGE.INDEXES.key);
            syncFromStorage(exchanges, storage, BROWSER_STORAGE.EXCHANGES.key);

            // Start listening for external changes (cross-context sync)
            addStorageChangedListener((changes) => {
                DomainUtils.log("STORES settings: cross-context sync");

                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.SKIN.key,
                    skin,
                    (nextSkin) => {
                        if (theme?.global?.name) {
                            theme.global.name.value = nextSkin;
                        }
                    }
                );
                applyStorageChange(changes, BROWSER_STORAGE.SERVICE.key, service);
                applyStorageChange(changes, BROWSER_STORAGE.INDEXES.key, indexes);
                applyStorageChange(changes, BROWSER_STORAGE.MARKETS.key, markets);
                applyStorageChange(changes, BROWSER_STORAGE.MATERIALS.key, materials);
                applyStorageChange(changes, BROWSER_STORAGE.EXCHANGES.key, exchanges);
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
                    activeAccountId
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
                    bookingsPerPage
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.STOCKS_PER_PAGE.key,
                    stocksPerPage
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
                    dividendsPerPage
                );
                applyStorageChange(
                    changes,
                    BROWSER_STORAGE.SUMS_PER_PAGE.key,
                    sumsPerPage
                );
            });
        }

        /**
         * Updates the page limit for summary tables.
         * @param {number} v - New items per page limit.
         */
        async function setSumsPerPage(v: number): Promise<void> {
            await updateSetting(sumsPerPage, BROWSER_STORAGE.SUMS_PER_PAGE.key, v);
        }

        /**
         * Updates the page limit for booking tables.
         * @param {number} v - New items per page limit.
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
         * @param {number} v - New items per page limit.
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
         * @param {number} v - New items per page limit.
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
         * @param {number} id - The ID of the account to activate.
         */
        async function setActiveAccountId(id: number): Promise<void> {
            await updateSetting(
                activeAccountId,
                BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
                id
            );
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
            init,
            setSumsPerPage,
            setBookingsPerPage,
            setDividendsPerPage,
            setStocksPerPage,
            setActiveAccountId
        };
    }
);

DomainUtils.log("STORES settings");
