/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {DialogNameType, MenuActionType} from "@/domain/types";

import {useAdapters} from "@/adapters/context";
import {useOnlineStockData} from "@/adapters/primary/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

export function useHeaderBarActions(t: (_key: string) => string): {
    onIconClick: (ev: Event) => Promise<void>;
} {
    const runtime = useRuntimeStore();
    const records = useRecordsStore();
    const {browserAdapter, alertAdapter, fetchAdapter} = useAdapters();
    const {refreshAllOnlineData} = useOnlineStockData();

    const openDialog = (dialogName: DialogNameType, dialogOk: boolean = true): void => {
        runtime.setTeleport({
            dialogName,
            dialogOk,
            dialogVisibility: true
        });
    };

    const dialogActions: Record<MenuActionType, () => void | Promise<void>> = {
        updateQuote: async () => {
            try {
                runtime.isStockLoading = true;
                runtime.isDownloading = true;
                fetchAdapter.clearCache();
                await refreshAllOnlineData();
            } catch (err) {
                await alertAdapter.feedbackError(t("views.headerBar.infoTitle"), err, {
                    data: {context: "UPDATE_QUOTE"},
                    logLevel: "error"
                });
            } finally {
                runtime.isStockLoading = false;
                runtime.isDownloading = false;
            }
        },

        fadeInStock: async () => {
            if (records.stocks.passive.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noCompany"));
            } else {
                openDialog("fadeInStock");
            }
        },

        addStock: () => {
            openDialog("addStock");
        },

        updateStock: () => {
            openDialog("updateStock");
        },

        addAccount: () => {
            openDialog("addAccount");
        },

        updateAccount: async () => {
            if (records.accounts.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("updateAccount");
            }
        },

        deleteAccountConfirmation: async () => {
            if (records.accounts.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("deleteAccountConfirmation");
            }
        },

        addBookingType: async () => {
            if (records.accounts.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("addBookingType");
            }
        },

        updateBookingType: async () => {
            if (records.bookingTypes.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBookingType"));
            } else {
                openDialog("updateBookingType");
            }
        },

        deleteBookingType: async () => {
            if (records.bookingTypes.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBookingType"));
            } else {
                openDialog("deleteBookingType");
            }
        },

        addBooking: async () => {
            if (records.accounts.items.length === 0) {
                void alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("addBooking");
            }
        },

        exportDatabase: () => {
            if (records.accounts.items.length === 0) {
                void alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("exportDatabase");
            }
        },

        importDatabase: () => {
            openDialog("importDatabase");
        },

        showAccounting: () => {
            if (records.bookings.items.length === 0) {
                void alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBooking"));
            } else {
                openDialog("showAccounting", false);
            }
        },

        deleteAccount: () => {
        },

        updateBooking: () => {
        },

        deleteBooking: () => {
        },

        showDividend: () => {
        },

        openLink: () => {
        },

        deleteStock: () => {
        },

        home: () => {
            runtime.setCurrentView("home");
        },

        company: () => {
            runtime.setCurrentView("company");
        },

        setting: async () => {
            await browserAdapter.openOptionsPage();
        }
    };

    const onIconClick = async (ev: Event): Promise<void> => {
        const target = ev.target as Element;
        const dialogId = target.closest("[id]")?.id;

        if (!dialogId) return;
        if (!(dialogId in dialogActions)) return;

        await dialogActions[dialogId as MenuActionType]();
    };

    return {onIconClick};
}

