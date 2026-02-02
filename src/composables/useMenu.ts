/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { useUserInfo } from "@/composables/useUserInfo";
import { useBookingsDB, useStocksDB } from "@/composables/useIndexedDB";
import { storeToRefs } from "pinia";
import type { MenuActionType } from "@/types";
import { computed, onUnmounted, readonly, ref } from "vue";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES,
  serializeError
} from "@/domains/errors";
import { CODES } from "@/config/codes";

type HighlightColor = "green" | "red" | "yellow" | "blue";

interface HighlightOptionsType {
  color?: HighlightColor;
  duration?: number;
}

/**
 * Composable to temporarily highlight rows/items in data tables.
 *
 * Provides helpers to set, clear, and auto-clear highlight states per record ID.
 * Intended for transient visual feedback after actions (e.g., add/update).
 *
 * @module composables/useMenuHighlight
 */
export function useMenuHighlight() {
  const highlightedItems = ref<Map<number, HighlightColor>>(new Map());
  const timeouts = new Map<number, ReturnType<typeof setTimeout>>();

  /**
   * Applies a highlight color to a record ID.
   * @param recordId - Target record identifier.
   * @param color - Optional color (default: green).
   */
  const highlight = (recordId: number, color: HighlightColor = "green") => {
    clearHighlight(recordId);
    highlightedItems.value.set(recordId, color);
  };

  /**
   * Clears the highlight for a specific record ID and cancels any pending auto-clear.
   * @param recordId - Target record identifier.
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
   * Clears all highlight markers and cancels all pending auto-clear timeouts.
   */
  const clearAllHighlights = () => {
    highlightedItems.value.clear();

    for (const timeout of timeouts.values()) {
      clearTimeout(timeout);
    }
    timeouts.clear();
  };

  /**
   * Temporarily highlights a record ID, automatically clearing after a duration.
   * @param recordId - Target record identifier.
   * @param options - Optional color and custom duration (ms, default 3000).
   */
  const highlightTemporary = (
    recordId: number,
    options: HighlightOptionsType = {}
  ) => {
    const { color = "green", duration = 3000 } = options;

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
   * Returns whether a record ID is currently highlighted.
   * @param recordId - Target record identifier.
   */
  const isHighlighted = (recordId: number): boolean => {
    return highlightedItems.value.has(recordId);
  };

  /**
   * Gets the highlight color for a record ID, if present.
   * @param recordId - Target record identifier.
   */
  const getHighlightColor = (
    recordId: number
  ): HighlightColor | undefined => {
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

type ActionHandler = (_recordId: number) => Promise<void>;

/**
 * Composable for managing application menu actions and navigation.
 * Centralizes the logic for opening dialogs, executing CRUD operations
 * from menus, and handling cross-view navigation.
 *
 * @module composables/useMenuAction
 */
export function useMenuAction() {
  const runtime = useRuntimeStore();
  const records = useRecordsStore();
  const { handleUserInfo } = useUserInfo();
  const { remove: removeBooking } = useBookingsDB();
  const { remove: removeStock } = useStocksDB();

  /**
   * Internal helper to open a dialog via the teleport system.
   *
   * @param dialogName - Unique name of the dialog component.
   * @param dialogOk - Whether the 'OK' button should be shown.
   */
  const openDialog = (dialogName: string, dialogOk = false): void => {
    runtime.setTeleport({
      dialogName,
      dialogOk,
      dialogVisibility: true
    });
  };

  /**
   * Checks if a stock has any associated bookings.
   *
   * @param stockId - ID of the stock to check.
   * @returns True if bookings exist.
   */
  const checkStockHasBookings = (stockId: number): boolean => {
    const { items: bookingItems } = storeToRefs(records.bookings);
    return bookingItems.value.some((booking) => booking.cStockID === stockId);
  };

  /**
   * Mapping of menu action keys to their handler functions.
   */
  const actionHandlers: Record<MenuActionType, ActionHandler> = {
    async updateBooking() {
      openDialog("updateBooking", true);
    },

    async addBooking() {
      openDialog("addBooking", true);
    },

    async deleteBooking(recordId: number) {
      records.bookings.remove(recordId);
      await removeBooking(recordId);
      await handleUserInfo(
        "notice",
        "Menu",
        "deleteBooking",
        { noticeLines: ["Booking deleted successfully"] }
      );
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
        await handleUserInfo(
          "notice",
          "Cannot Delete",
          "deleteStock",
          {
            noticeLines: [
              "This stock has associated bookings. Delete bookings first."
            ]
          }
        );
        return;
      }

      records.stocks.remove(recordId);
      await removeStock(recordId);
      await handleUserInfo(
        "notice",
        "Menu",
        "deleteStock",
        { noticeLines: ["Stock deleted successfully"] }
      );
    },

    async fadeInStock() {
      openDialog("fadeInStock", true);
    },

    async updateQuote() {
      openDialog("updateQuote", true);
    },

    // Account Actions
    async addAccount() {
      openDialog("addAccount", true);
    },

    async updateAccount() {
      openDialog("updateAccount", true);
    },

    async deleteAccount() {
      openDialog("deleteAccount", true);
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
      const { items: stockItems } = storeToRefs(records.stocks);
      const stockIndex = records.stocks.getIndexById(recordId);
      const url = stockItems.value[stockIndex]?.cURL;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        await handleUserInfo(
          "notice",
          "Menu",
          "openLink",
          { noticeLines: ["No URL available for this stock"] }
        );
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
      runtime.setCurrentView(CODES.VIEW_CODES.HOME);
    },

    async company() {
      runtime.setCurrentView(CODES.VIEW_CODES.COMPANY);
    },

    async setting() {
      runtime.setCurrentView(CODES.VIEW_CODES.SETTINGS);
    }
  };

  /**
   * Executes a specific menu action.
   *
   * @param actionType - The identifier of the action.
   * @param recordId - The ID of the record associated with the action.
   */
  const executeAction = async (
    actionType: MenuActionType,
    recordId: number
  ): Promise<void> => {
    runtime.activeId = recordId;

    const handler = actionHandlers[actionType];

    if (!handler) {
      throw new AppError(
        ERROR_CODES.USE_MENU.A,
        ERROR_CATEGORY.VALIDATION,
        { input: { actionType } },
        false
      );
    }

    try {
      await handler(recordId);
    } catch (err) {
      throw new AppError(
        ERROR_CODES.USE_MENU.B,
        ERROR_CATEGORY.VALIDATION,
        { input: serializeError(err), actionType, recordId },
        true
      );
    }
  };

  const hasAction = (actionType: string): actionType is MenuActionType => {
    return actionType in actionHandlers;
  };

  return {
    executeAction,
    hasAction
  };
}
