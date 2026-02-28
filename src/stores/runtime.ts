/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {TeleportState, ViewTypeSelectionType} from "@/types";
import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {DomainUtils} from "@/domains/utils";

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
        dialogName: "",
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
    const dialogName = ref<string>();

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
     * Clears all tracked loaded stock pages.
     */
    function clearStocksPages(): void {
        loadedStocksPages.clear();
    }

    /**
     * Configures and displays a dialog via the teleport system.
     *
     * @param {TeleportState} entry - The dialog configuration details.
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
     * @param {ViewTypeSelectionType} view - The target view identifier to switch to.
     */
    function setCurrentView(view: ViewTypeSelectionType): void {
        currentView.value = view;

        // Ensure UI the state is clean when navigating
        resetTeleport();
    }

    return {
        activeId,
        getCurrentView,
        optionMenuColors,
        dialogName,
        dialogOk,
        dialogVisibility,
        infoExchanges,
        infoIndexes,
        infoMaterials,
        curUsd,
        curEur,
        stocksPage,
        loadedStocksPages,
        isDownloading,
        isStockLoading,
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors,
        clearStocksPages,
        setCurrentView
    };
});

DomainUtils.log("STORES runtime");
