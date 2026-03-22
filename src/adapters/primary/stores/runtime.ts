/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import type {DialogNameType, TeleportState, ViewTypeSelectionType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

/**
 * Pinia store for runtime and UI state.
 *
 * This store manages volatile application state that does not require persistence,
 * such as navigation, dialog visibility, loading indicators, and temporary UI overrides.
 *
 * @module stores/runtime
 * @returns An object containing reactive runtime state and
 * methods to mutate or reset transient UI data.
 */
export const useRuntimeStore = defineStore("runtime", function () {
    const DEFAULT_TELEPORT_STATE: TeleportState = {
        dialogName: undefined,
        dialogOk: true,
        dialogVisibility: false
    };

    /**
     * Currently active entity identifier.
     *
     * A value of `-1` indicates that no entity is selected.
     */
    const activeId = ref<number>(-1);

    /** Currently active application view. */
    const currentView = ref<ViewTypeSelectionType>("home");

    /**
     * Map of color overrides for option menu entries.
     * Key: Menu item ID (number), Value: CSS color string.
     */
    const optionMenuColors = ref<Map<number, string>>(new Map());

    /** Name of the currently active dialog/teleport component. */
    const dialogName = ref<DialogNameType | undefined>();

    /** Indicates whether the dialog confirmation action is allowed. */
    const dialogOk = ref<boolean>(true);

    /** Controls dialog visibility. */
    const dialogVisibility = ref<boolean>(false);

    /** Exchange-related info counters. */
    const infoExchanges = ref<Map<string, number>>(new Map());

    /** Index-related info counters. */
    const infoIndexes = ref<Map<string, number>>(new Map());

    /** Material-related info counters. */
    const infoMaterials = ref<Map<string, number>>(new Map());

    /** Current USD conversion factor. */
    const curUsd = ref<number>(1);

    /** Current EUR conversion factor. */
    const curEur = ref<number>(1);

    /** Current page index for stocks pagination. */
    const stocksPage = ref<number>(1);

    /** Global flag indicating if a network download operation is active. */
    const isDownloading = ref<boolean>(false);

    /** Specific flag indicating if stock data is being fetched or processed. */
    const isStockLoading = ref<boolean>(false);

    const getCurrentView = computed((): ViewTypeSelectionType => currentView.value);

    /**
     * Set of page numbers that have successfully loaded stock data.
     * Prevents redundant API calls for the same page.
     */
    const loadedStocksPages = new Set<number>();

    /**
     * Timestamp (ms since epoch) when a given page was last successfully loaded.
     * Used to expire the "loaded" marker after some time, so rates can refresh.
     */
    const loadedStocksPagesAt = new Map<number, number>();

    /**
     * Clears all tracked loaded stock pages.
     */
    function clearStocksPages(): void {
        loadedStocksPages.clear();
        loadedStocksPagesAt.clear();
    }

    /**
     * Marks a stock page as loaded "now".
     */
    function markStocksPageLoaded(page: number): void {
        loadedStocksPages.add(page);
        loadedStocksPagesAt.set(page, Date.now());
    }

    /**
     * Invalidates a previously loaded page marker (so it will be re-fetched).
     */
    function invalidateStocksPage(page: number): void {
        loadedStocksPages.delete(page);
        loadedStocksPagesAt.delete(page);
    }

    /**
     * Returns whether a page is considered "fresh" based on its last loaded timestamp.
     */
    function isStocksPageFresh(page: number, maxAgeMs: number): boolean {
        if (!loadedStocksPages.has(page)) return false;
        const ts = loadedStocksPagesAt.get(page);
        if (!ts) return false;
        return Date.now() - ts <= maxAgeMs;
    }

    /**
     * Configures and displays a dialog via the teleport system.
     *
     * @param entry - The dialog configuration details.
     */
    function setTeleport(entry: TeleportState): void {
        dialogName.value = entry.dialogName;
        dialogOk.value = entry.dialogOk;
        dialogVisibility.value = entry.dialogVisibility;
    }

    /**
     * Resets the teleport dialog state to hidden/default values
     * and clears any temporary menu color overrides.
     */
    function resetTeleport(): void {
        setTeleport(DEFAULT_TELEPORT_STATE);
        dialogName.value = undefined;
        resetOptionsMenuColors();
    }

    /**
     * Clears all color overrides applied to option menu items.
     */
    function resetOptionsMenuColors(): void {
        optionMenuColors.value.clear();
    }

    /**
     * Updates the active view and performs necessary state resets.
     *
     * @param view - The target view identifier to switch to.
     */
    function setCurrentView(view: ViewTypeSelectionType): void {
        currentView.value = view;

        // Ensure UI the state is clean when navigating
        resetTeleport();
    }

    return {
        activeId,
        curUsd,
        curEur,
        dialogName,
        dialogOk,
        dialogVisibility,
        getCurrentView,
        infoExchanges,
        infoIndexes,
        infoMaterials,
        isDownloading,
        isStockLoading,
        optionMenuColors,
        stocksPage,
        loadedStocksPages,
        loadedStocksPagesAt,
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors,
        clearStocksPages,
        markStocksPageLoaded,
        invalidateStocksPage,
        isStocksPageFresh,
        setCurrentView
    };
});

log("STORES runtime");

