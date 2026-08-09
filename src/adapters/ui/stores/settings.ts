/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {type Ref, ref, toRaw} from "vue";

import {BROWSER_STORAGE} from "@/domain/constants";
import type {StorageDataType, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {getSettingsStoreDeps, getStoreTranslate} from "@/adapters/ui/stores/deps";

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
     *                                           The default value is -1 if no account is selected.
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
     */,
    function () {
        const {storageAdapter, alertAdapter} = getSettingsStoreDeps();
        const {getStorage, setStorage, addStorageChangedListener} = storageAdapter();
        let removeStorageChangeListener: (() => void) | null = null;

        /** Resolves the translated alert title, falling back to English if i18n isn't wired yet. */
        function errorTitle(): string {
            const t = getStoreTranslate();
            return t ? t("stores.settings.errorTitle") : "Settings error";
        }

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

        /**
         * App-level default currency — see `BROWSER_STORAGE.CURRENCY`.
         *
         * Not the display currency on its own: that is the active account's
         * `cCurrency`, with this as the fallback. `resolveDisplayCurrency`
         * (`domain/logic.ts`) is the single place those two are combined.
         */
        const currency = ref<string>(BROWSER_STORAGE.CURRENCY.value);

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
         * Compares two storage values for equality.
         *
         * Every settings value is a primitive or a flat array of primitives, so
         * a length-plus-element scan is a complete comparison here — there is no
         * nested structure to miss. See {@link applyStorageChange} for why the
         * array case is the one that matters.
         */
        function isSameStorageValue<T extends StorageValueType>(a: T, b: T): boolean {
            if (Array.isArray(a) && Array.isArray(b)) {
                return a.length === b.length && a.every((entry, i) => entry === b[i]);
            }
            return a === b;
        }

        /**
         * Applies changes from a storage event to a specific key in the target reference and executes an optional callback.
         *
         * **Ignores a change that carries the value this context already holds.**
         * `browser.storage.onChanged` fires in *every* extension context,
         * including the one that performed the write — so each
         * `updateSetting()` → `setStorage()` round trip came straight back here
         * and re-applied its own value locally.
         *
         * The re-assignment was idempotent for primitives, but not free:
         *
         * - For the four array settings, `cloneStorageValue` hands back a **new
         *   array**, so the ref's identity changed and any watcher on it fired
         *   again for a value that had not changed.
         * - `activeAccountId` is watched in `AppIndex.vue`, which clears the
         *   stocks page cache — correct either way, but done twice per switch.
         * - `onChange` (the parameter below) would fire twice for one user
         *   action, which is a trap for the first side-effecting callback added.
         *
         * Value equality rather than an origin marker on the write, deliberately:
         * a marker has to be applied by *every* writer, and a missed writer is a
         * silent regression. This needs no cooperation from the write side, and
         * a genuine cross-context change necessarily differs from what this
         * context holds.
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
            if (isSameStorageValue(target.value, nextValue)) return;

            target.value = nextValue;
            onChange?.(nextValue);
        }

        /**
         * Internal helper to update a state property and its corresponding browser storage entry.
         *
         * @param refVar - The reactive reference to update.
         * @param key - The key used in browser storage.
         * @param value - The new value to apply.
         * @param options - See `rethrow`.
         * @param options.rethrow - Re-throw a failed persist (after reverting the
         *        optimistic value) instead of reporting it through the global
         *        alert. For callers that surface failures in their own place:
         *        `CheckboxGrid` renders an inline `v-alert` beside the checkbox
         *        whose toggle was just rolled back, and `DynamicList` needs to
         *        know a write failed so it can restore the exchange rate it
         *        removed alongside the entry. Neither can act on an error this
         *        function has already swallowed.
         */
        async function updateSetting<T extends StorageValueType>(
            refVar: Ref<T>,
            key: string,
            value: T,
            options: { rethrow?: boolean } = {}
        ) {
            const prev = refVar.value;
            refVar.value = value;
            try {
                await setStorage(key, value);
            } catch (err) {
                // Only roll back if this call's optimistic value is still current: an
                // overlapping later call may have already applied and persisted a
                // different value while this one was in flight, and rolling back
                // unconditionally would clobber that newer, already-successful write.
                //
                // Compared through `toRaw`. A bare `refVar.value === value` is
                // correct only for a primitive: `ref()` stores an object through
                // `toReactive`, so reading `.value` on one of the four ARRAY
                // settings hands back a reactive proxy, never the array that was
                // assigned — the identity test was therefore always false and
                // those settings would never have rolled back at all. Latent
                // until now only because every setter that existed held a
                // primitive; the list setters below are the first that do not.
                if (toRaw(refVar.value) === toRaw(value)) {
                    refVar.value = prev;
                }
                if (options.rethrow) throw err;
                await alertAdapter.feedbackError(errorTitle(), err, {});
            }
        }

        /**
         * Loads settings from browser storage and initializes the store.
         * Useful for contexts that don't run the full app bootstrap (e.g., option page).
         */
        async function load(): Promise<void> {
            try {
                const storage = await getStorage();
                init(storage);
            } catch (err) {
                await alertAdapter.feedbackError(errorTitle(), err, {});
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
            syncFromStorage(currency, storage, BROWSER_STORAGE.CURRENCY.key, BROWSER_STORAGE.CURRENCY.value);
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
                applyStorageChange(changes, BROWSER_STORAGE.CURRENCY.key, currency, BROWSER_STORAGE.CURRENCY.value);
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

        /** Updates the active UI skin/theme. */
        async function setSkin(v: string): Promise<void> {
            await updateSetting(skin, BROWSER_STORAGE.SKIN.key, v);
        }

        /** Updates the active market data provider. */
        async function setService(v: string): Promise<void> {
            await updateSetting(service, BROWSER_STORAGE.SERVICE.key, v);
        }

        /**
         * Updates the app-level default currency.
         *
         * Affects newly created accounts and the no-account display fallback.
         * It deliberately does NOT rewrite existing accounts' `cCurrency`:
         * those denote what their stored booking amounts actually are, and
         * changing that here would relabel real money without converting it.
         */
        async function setCurrency(v: string): Promise<void> {
            await updateSetting(currency, BROWSER_STORAGE.CURRENCY.key, v);
        }

        /**
         * Updates the active account id.
         *
         * `activeAccountId` was the one persisted setting with no paired setter,
         * so callers assigned the ref and called `setStorage` separately — and
         * lost everything `updateSetting` provides: if that write rejected, the
         * in-memory active account and the persisted one disagreed until the
         * next reload, with no rollback and no alert. That is precisely the case
         * `updateSetting` exists to prevent, and the most consequential setting
         * to get it wrong on, since a mismatched active account makes a later
         * add persist under one account while displaying under another.
         *
         * Note this is *not* the same seam as
         * `portAdapters.setActiveAccountIdPersisted`, which the app layer uses:
         * that one writes through a `SettingsPort` (a plain
         * `{activeAccountId}` object, no store) and does its own revert. This is
         * the store-side equivalent for UI code that holds the store directly.
         */
        async function setActiveAccountId(v: number): Promise<void> {
            await updateSetting(activeAccountId, BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, v);
        }

        /**
         * The four list settings edited on the options page.
         *
         * These were the last settings with no setter, so `CheckboxGrid` and
         * `DynamicList` each read their key straight from `browser.storage.local`
         * on mount into a private ref and wrote back from that copy — a second
         * source of truth for state this store already holds, and a second,
         * hand-rolled copy of the optimistic-update-and-roll-back logic
         * `updateSetting` exists to provide.
         *
         * Both take `{rethrow: true}`: each component reports failures in its own
         * surface (see the option's own note), so the global alert would be a
         * duplicate.
         */
        async function setIndexes(v: string[], options: { rethrow?: boolean } = {}): Promise<void> {
            await updateSetting(indexes, BROWSER_STORAGE.INDEXES.key, v, options);
        }

        async function setMaterials(v: string[], options: { rethrow?: boolean } = {}): Promise<void> {
            await updateSetting(materials, BROWSER_STORAGE.MATERIALS.key, v, options);
        }

        async function setMarkets(v: string[], options: { rethrow?: boolean } = {}): Promise<void> {
            await updateSetting(markets, BROWSER_STORAGE.MARKETS.key, v, options);
        }

        async function setExchanges(v: string[], options: { rethrow?: boolean } = {}): Promise<void> {
            await updateSetting(exchanges, BROWSER_STORAGE.EXCHANGES.key, v, options);
        }

        return {
            skin,
            bookingsPerPage,
            stocksPerPage,
            dividendsPerPage,
            sumsPerPage,
            activeAccountId,
            service,
            currency,
            materials,
            markets,
            indexes,
            exchanges,
            load,
            init,
            setCurrency,
            setSkin,
            setSumsPerPage,
            setBookingsPerPage,
            setDividendsPerPage,
            setStocksPerPage,
            setService,
            setActiveAccountId,
            setIndexes,
            setMaterials,
            setMarkets,
            setExchanges
        };
    }
);

log("STORES settings");
