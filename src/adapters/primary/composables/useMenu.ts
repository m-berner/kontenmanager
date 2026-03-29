/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {computed, onUnmounted, readonly, ref} from "vue";

import {hasBookings} from "@/domain/logic";
import type {ActionHandler, DialogNameType, HighlightColor, HighlightOptions, MenuActionType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useOnlineStockData} from "@/adapters/primary/composables/useOnlineStockData";
import {useRepositories} from "@/adapters/primary/composables/useRepositories";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import type {BrowserAdapter} from "@/adapters/secondary/types";

/**
 * Manages temporary row highlighting for table-like UIs.
 *
 * The composable stores a highlight color per record id and optionally removes it
 * after a timeout. It is intended for short-lived visual feedback after user
 * actions such as add, update, or delete a record.
 *
 * Returned state is exposed as readonly to keep the mutation in one place.
 *
 * @module composables/useMenuHighlight
 */
export function useMenuHighlight() {
    const highlightedItems = ref<Map<number, HighlightColor>>(new Map());
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>();

    /**
     * Applies a highlight to one record.
     *
     * Any existing timeout for the same record is cleared first, so stale timers
     * do not remove a newer highlight state.
     *
     * @param recordId - Record identifier.
     * @param color - Highlight color (defaults to `green`).
     */
    const highlight = (recordId: number, color: HighlightColor = "green") => {
        clearHighlight(recordId);
        highlightedItems.value.set(recordId, color);
    };

    /**
     * Removes the highlight state for one record and cancels its timeout, if present.
     *
     * @param recordId - Record identifier.
     */
    const clearHighlight = (recordId: number) => {
        highlightedItems.value.delete(recordId);

        const timeout = timeouts.get(recordId);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.delete(recordId);
        }
    };

    /**
     * Clears all highlight entries and cancels all scheduled auto-clear timers.
     */
    const clearAllHighlights = () => {
        highlightedItems.value.clear();

        for (const timeout of timeouts.values()) {
            clearTimeout(timeout);
        }
        timeouts.clear();
    };

    /**
     * Applies a temporary highlight to one record.
     *
     * If a timer already exists for this record, it is replaced.
     *
     * @param recordId - Record identifier.
     * @param options - Optional highlight configuration.
     * @param options.color - Highlight color (defaults to `green`).
     * @param options.duration - Lifetime in milliseconds (defaults to `3000`).
     */
    const highlightTemporary = (
        recordId: number,
        options: HighlightOptions = {}
    ) => {
        const {color = "green", duration = 3000} = options;

        highlight(recordId, color);

        const existingTimeout = timeouts.get(recordId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
            clearHighlight(recordId);
        }, duration);

        timeouts.set(recordId, timeout);
    };

    /**
     * Checks whether a record is currently highlighted.
     *
     * @param recordId - Record identifier.
     */
    const isHighlighted = (recordId: number): boolean => {
        return highlightedItems.value.has(recordId);
    };

    /**
     * Returns the highlight color for a record, if any.
     *
     * @param recordId - Record identifier.
     */
    const getHighlightColor = (recordId: number): HighlightColor | undefined => {
        return highlightedItems.value.get(recordId);
    };

    onUnmounted(() => {
        clearAllHighlights();
    });

    return {
        highlightedItems: readonly(computed(() => highlightedItems.value)),
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary,
        isHighlighted,
        getHighlightColor
    };
}

/**
 * Provides handlers for context/menu actions across the application.
 *
 * Responsibilities:
 * - open dialogs via runtime teleport state
 * - execute delete operations for bookings/stocks
 * - perform view navigation actions
 * - send user feedback messages via `alertAdapter`
 *
 * The optional `translate` function allows using vue-i18n translations while
 * still falling back to browser i18n messages via `browserAdapter.getMessage()`.
 *
 * @module composables/useMenuAction
 */
export function useMenuAction(translate?: (_key: string) => string) {
    const runtime = useRuntimeStore();
    const records = useRecordsStore();
    const {alertAdapter, browserAdapter} = useAdapters();
    const {loadOnlineData} = useOnlineStockData();
    const {bookingsRepository, stocksRepository} = useRepositories();

    /**
     * Opens a dialog using runtime teleport state.
     *
     * @param dialogName - Dialog component identifier.
     * @param dialogOk - Whether the dialog confirms with an explicit OK action.
     */
    const openDialog = (dialogName: DialogNameType, dialogOk = false): void => {
        runtime.setTeleport({
            dialogName,
            dialogOk,
            dialogVisibility: true
        });
    };

    /**
     * Returns whether a stock still has linked bookings.
     *
     * Stocks with linked bookings cannot be deleted.
     *
     * @param stockId - Stock identifier.
     */
    const checkStockHasBookings = (stockId: number): boolean => {
        return hasBookings(stockId, records.bookings.items);
    };

    /**
     * Resolves a localized message key to a display string.
     *
     * Resolution order:
     * 1. `translate` (if provided)
     * 2. `getMessage` fallback from `browserAdapter.getMessage`
     *
     * @param key - Translation/message key.
     */
    const resolveMessage = (key: Parameters<BrowserAdapter["getMessage"]>[0] | string): string => {
        if (!translate) {
            return "System error: resolveMessage";
        }
        const translated = translate(key);
        return translated && translated !== key
            ? translated
            : browserAdapter.getMessage(key as Parameters<BrowserAdapter["getMessage"]>[0]);
    };

    let updateQuoteController: AbortController | null = null;
    onUnmounted(() => {
        updateQuoteController?.abort();
        updateQuoteController = null;
    });

    const actionHandlers: Record<MenuActionType, ActionHandler> = {
        async updateBooking() {
            openDialog("updateBooking", true);
        },

        async addBooking() {
            openDialog("addBooking", true);
        },

        async deleteBooking(recordId: number) {
            await bookingsRepository.delete(recordId);
            records.bookings.remove(recordId);
            await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.delete"));
        },

        // Stock Actions
        async updateStock() {
            openDialog("updateStock", true);
        },

        async addStock() {
            openDialog("addStock", true);
        },

        async deleteStock(recordId: number) {
            if (checkStockHasBookings(recordId)) {
                await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.noDelete"));
                return;
            }

            records.stocks.remove(recordId);
            await stocksRepository.delete(recordId);
            await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.delete"));
        },

        async fadeInStock() {
            openDialog("fadeInStock", true);
        },

        async updateQuote() {
            updateQuoteController?.abort();
            updateQuoteController = new AbortController();
            const signal = updateQuoteController.signal;
            runtime.isStockLoading = true;
            runtime.isDownloading = true;
            try {
                await loadOnlineData(runtime.stocksPage, {signal});
            } finally {
                updateQuoteController = null;
                runtime.isStockLoading = false;
                runtime.isDownloading = false;
            }
        },

        // Account Actions
        async addAccount() {
            openDialog("addAccount", true);
        },

        async updateAccount() {
            openDialog("updateAccount", true);
        },

        async deleteAccount() {
            openDialog("deleteAccountConfirmation", true);
        },

        async deleteAccountConfirmation() {
            openDialog("deleteAccountConfirmation", true);
        },

        // Booking Type Actions
        async addBookingType() {
            openDialog("addBookingType", true);
        },

        async updateBookingType() {
            openDialog("updateBookingType", true);
        },

        async deleteBookingType() {
            openDialog("deleteBookingType", true);
        },

        // Info & Display Actions
        async showDividend() {
            openDialog("showDividend", false);
        },

        async showAccounting() {
            openDialog("showAccounting", false);
        },

        async openLink(recordId: number) {
            const stock = records.stocks.getById(recordId);
            const url = stock?.cURL;

            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
            } else {
                await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.noLink"));
            }
        },

        // Database Actions
        async exportDatabase() {
            openDialog("exportDatabase", true);
        },

        async importDatabase() {
            openDialog("importDatabase", true);
        },

        // Navigation Actions
        async home() {
            runtime.setCurrentView("home");
        },

        async company() {
            runtime.setCurrentView("company");
        },

        async setting() {
            runtime.setCurrentView("settings");
        }
    };

    /**
     * Executes one menu action and captures failures as user-visible alerts.
     *
     * @param actionType - Menu action identifier.
     * @param recordId - Target record identifier.
     */
    const executeAction = async (
        actionType: MenuActionType,
        recordId: number
    ): Promise<void> => {
        runtime.activeId = recordId;

        const handler = actionHandlers[actionType];

        if (!handler) {
            await alertAdapter.feedbackError(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.invalidCode"), {
                data: actionType
            });
            return;
        }

        try {
            await handler(recordId);
        } catch (err) {
            await alertAdapter.feedbackError(resolveMessage("composables.useMenu.title"), err, {
                data: actionType
            });
        }
    };

    /**
     * Type guard that checks whether a string is a known menu action.
     *
     * @param actionType - Candidate action key.
     */
    const hasAction = (actionType: string): actionType is MenuActionType => {
        return actionType in actionHandlers;
    };

    return {
        executeAction,
        hasAction
    };
}

log("COMPOSABLES useMenu");
