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

    /**
     * Number of in-flight callers currently holding the download/stock-loading
     * flags up. Multiple independent call sites (header-bar refresh, per-row
     * quote update, company-page loads) can overlap; a plain boolean would let
     * whichever finishes first clear the flag while another is still running.
     */
    const downloadRefCount = ref<number>(0);
    const stockLoadingRefCount = ref<number>(0);

    /** Marks one caller as downloading; pair with exactly one endDownload(). */
    function beginDownload(): void {
        downloadRefCount.value += 1;
        isDownloading.value = true;
    }

    /** Releases one caller's downloading claim; only clears the flag once all have. */
    function endDownload(): void {
        downloadRefCount.value = Math.max(0, downloadRefCount.value - 1);
        if (downloadRefCount.value === 0) isDownloading.value = false;
    }

    /** Marks one caller as stock-loading; pair with exactly one endStockLoading(). */
    function beginStockLoading(): void {
        stockLoadingRefCount.value += 1;
        isStockLoading.value = true;
    }

    /** Releases one caller's stock-loading claim; only clears the flag once all have. */
    function endStockLoading(): void {
        stockLoadingRefCount.value = Math.max(0, stockLoadingRefCount.value - 1);
        if (stockLoadingRefCount.value === 0) isStockLoading.value = false;
    }

    const getCurrentView = computed((): ViewTypeSelectionType => currentView.value);

    /**
     * Set of page numbers that have successfully loaded stock data.
     * Prevents redundant API calls for the same page.
     */
    const loadedStocksPages = ref<Set<number>>(new Set());

    /**
     * Timestamp (ms since epoch) when a given page was last successfully loaded.
     * Used to expire the "loaded" marker after some time, so rates can refresh.
     */
    const loadedStocksPagesAt = ref<Map<number, number>>(new Map());

    /**
     * Clears all tracked loaded stock pages.
     */
    function clearStocksPages(): void {
        loadedStocksPages.value.clear();
        loadedStocksPagesAt.value.clear();
    }

    /**
     * Marks a stock page as loaded "now".
     */
    function markStocksPageLoaded(page: number): void {
        loadedStocksPages.value.add(page);
        loadedStocksPagesAt.value.set(page, Date.now());
    }

    /**
     * Invalidates a previously loaded page marker (so it will be re-fetched).
     */
    function invalidateStocksPage(page: number): void {
        loadedStocksPages.value.delete(page);
        loadedStocksPagesAt.value.delete(page);
    }

    /**
     * Monotonic per-page counter. Three independent callers (per-row quote
     * update, header-bar refresh-all, company-page loads) can each have an
     * online-data fetch for the same page in flight at once, each with its own
     * AbortController that only cancels requests from within its own caller.
     * This counter lets loadOnlineData detect a response that resolved after
     * being superseded by a newer request for the same page from a *different*
     * caller, so it can discard the stale write instead of clobbering fresher
     * data that already landed.
     */
    const stocksPageGeneration = ref<Map<number, number>>(new Map());

    /** Marks the start of a new fetch attempt for a page; returns its generation number. */
    function bumpStocksPageGeneration(page: number): number {
        const next = (stocksPageGeneration.value.get(page) ?? 0) + 1;
        stocksPageGeneration.value.set(page, next);
        return next;
    }

    /** Returns whether `generation` is still the most recently started fetch attempt for `page`. */
    function isStocksPageGenerationCurrent(page: number, generation: number): boolean {
        return stocksPageGeneration.value.get(page) === generation;
    }

    /**
     * Returns whether a page is considered "fresh" based on its last loaded timestamp.
     */
    function isStocksPageFresh(page: number, maxAgeMs: number): boolean {
        if (!loadedStocksPages.value.has(page)) return false;
        const ts = loadedStocksPagesAt.value.get(page);
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
        beginDownload,
        endDownload,
        beginStockLoading,
        endStockLoading,
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
        bumpStocksPageGeneration,
        isStocksPageGenerationCurrent,
        setCurrentView
    };
});

log("STORES runtime");

