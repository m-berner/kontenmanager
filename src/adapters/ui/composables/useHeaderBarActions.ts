/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {onUnmounted} from "vue";

import type {DialogNameType, MenuActionType} from "@/domain/types";

import {useAdapters} from "@/adapters/context";
import {useOnlineStockData} from "@/adapters/ui/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";

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

    let updateQuoteController: AbortController | null = null;
    onUnmounted(() => {
        updateQuoteController?.abort();
        updateQuoteController = null;
    });

    const dialogActions: Record<MenuActionType, () => void | Promise<void>> = {
        updateQuote: async () => {
            updateQuoteController?.abort();
            const controller = new AbortController();
            updateQuoteController = controller;
            runtime.beginStockLoading();
            runtime.beginDownload();
            try {
                fetchAdapter.clearCache();
                await refreshAllOnlineData({signal: controller.signal});
            } catch (err) {
                // Superseded by a newer updateQuote() call; not a real failure.
                if (controller.signal.aborted) return;
                await alertAdapter.feedbackError(t("views.headerBar.infoTitle"), err, {
                    data: {context: "UPDATE_QUOTE"},
                    logLevel: "error"
                });
            } finally {
                if (updateQuoteController === controller) updateQuoteController = null;
                // Ref-counted: other in-flight callers (e.g. a per-row quote
                // update) may still be holding the shared flags up.
                runtime.endStockLoading();
                runtime.endDownload();
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

        addAccount: () => {
            openDialog("addAccount");
        },

        // The four actions below operate ON the active account, so they need
        // "is one selected and still present", not "does any account exist".
        // Those were equivalent only while activeAccountId === -1 implied zero
        // accounts; with accounts present but none active, the length test waved
        // every one of them through — UpdateAccount then rendered a blank form
        // and DeleteAccountConfirmation reported success for deleting nothing.
        //
        // exportDatabase below deliberately keeps the length test: it exports the
        // whole database, so "any account exists" really is its precondition.
        updateAccount: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("updateAccount");
            }
        },

        deleteAccountConfirmation: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("deleteAccountConfirmation");
            }
        },

        addBookingType: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("addBookingType");
            }
        },

        // Both preconditions, in order of specificity. `hasActiveAccount` comes
        // first for the same reason the four account actions above use it:
        // booking types are account-scoped, and the record stores are NOT
        // cleared when `activeAccountId` falls back to the no-account sentinel
        // (`HomeContent.onResetStorage` exists precisely because that leaves the
        // stores holding the previous account's rows). So a bare length test let
        // both dialogs open with no active account, listing a stale account's
        // types. `addBookingType` was migrated to the new predicate; these two
        // were left on the old one.
        //
        // The length test is kept underneath rather than replaced: "this account
        // has no booking types yet" is the more specific answer when an account
        // IS active, and it is the only one of the two the user can act on.
        updateBookingType: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else if (records.bookingTypes.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBookingType"));
            } else {
                openDialog("updateBookingType");
            }
        },

        deleteBookingType: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else if (records.bookingTypes.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBookingType"));
            } else {
                openDialog("deleteBookingType");
            }
        },

        addBooking: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("addBooking");
            }
        },

        exportDatabase: async () => {
            if (records.accounts.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noAccount"));
            } else {
                openDialog("exportDatabase");
            }
        },

        importDatabase: () => {
            openDialog("importDatabase");
        },

        showAccounting: async () => {
            if (records.bookings.items.length === 0) {
                await alertAdapter.feedbackInfo(t("views.headerBar.infoTitle"), t("views.headerBar.messages.noBooking"));
            } else {
                openDialog("showAccounting", false);
            }
        },

        // `deleteAccount` opens the same confirmation dialog `useMenu` routes it
        // to, rather than being a no-op. This file and `useMenu` are two
        // independently maintained `Record<MenuActionType, …>` tables over one
        // action-id union with no shared source of truth, and they disagreed
        // here: `useMenu` opened `deleteAccountConfirmation`, this one did
        // nothing.
        //
        // Not a live defect — `HeaderBar.vue` emits 16 ids and `deleteAccount`
        // is not among them (the bar uses `deleteAccountConfirmation`
        // directly), so the entry was unreachable, exactly like the six
        // row-level no-ops below. What made it worth closing is that adding a
        // `deleteAccount` control to the header bar later would have silently
        // done nothing, and the exhaustive `Record` type would not have
        // objected, because the key was present.
        //
        // The `hasActiveAccount` precondition matches the sibling
        // `deleteAccountConfirmation` entry in this same table.
        deleteAccount: async () => {
            if (!records.hasActiveAccount) {
                await alertAdapter.feedbackInfo(
                    t("views.headerBar.infoTitle"),
                    t("views.headerBar.messages.noAccount")
                );
                return;
            }
            openDialog("deleteAccountConfirmation");
        },

        // Row-level actions dispatched from a record's DotMenu, never from a
        // header icon. The exhaustive `Record<MenuActionType, …>` type forces an
        // entry for each; these no-ops are the honest implementation, and unlike
        // `deleteAccount` above there is no header-bar affordance they could
        // ever plausibly grow.
        //
        // `updateStock` belongs here and used to be missing from the list — it
        // called `openDialog("updateStock")` instead. That was not merely
        // inconsistent: `UpdateStock.vue` loads `runtime.activeId`, a generic
        // "last row acted on" id that `useMenu.executeAction` writes for ANY
        // DotMenu action, including booking rows. Opening the dialog from a
        // header icon would therefore have edited whichever record id happened
        // to be sitting there — the cross-store id-collision hazard
        // `UpdateBookingType.vue` documents at length and deliberately guards
        // against. Unreachable today (HeaderBar emits 16 ids and this is not one
        // of them), which is exactly the situation the sibling `deleteAccount`
        // entry was fixed for; the difference is that this one would have done
        // something wrong rather than nothing.
        updateStock: () => {
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
        // Prefer the element the listener is attached to (currentTarget) to resolve the ID,
        // because clicks on inner icons may set `event.target` to a child without the desired id.
        const current = ev.currentTarget as Element | null;
        const target = ev.target as Element | null;
        const dialogId = current?.closest("[id]")?.id ?? target?.closest("[id]")?.id;

        if (!dialogId) return;
        if (!(dialogId in dialogActions)) return;

        try {
            await dialogActions[dialogId as MenuActionType]();
        } catch (err) {
            // Most actions here just open a dialog and can't fail, but some
            // (e.g. "setting" -> browserAdapter.openOptionsPage()) call into
            // a browser API documented to throw. Without this, a rejection
            // reaches Vue's global error handler with no user-visible
            // feedback, unlike the equivalent action dispatched through
            // useMenu.ts's executeAction, which always surfaces the error.
            await alertAdapter.feedbackError(t("views.headerBar.infoTitle"), err, {
                data: {context: dialogId}
            });
        }
    };

    return {onIconClick};
}

