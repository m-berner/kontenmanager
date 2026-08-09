/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {computed, onUnmounted, readonly, ref} from "vue";

import {removeBookingUsecase} from "@/app/usecases/bookings";
import {toRecordsPort} from "@/app/usecases/portAdapters";
import {removeStockUsecase} from "@/app/usecases/stocks";

import {isConfirmDialogBusyError} from "@/domain/errors";
import {hasBookings} from "@/domain/logic";
import type {ActionHandler, DialogNameType, HighlightColor, HighlightOptions, MenuActionType} from "@/domain/types";
import {sanitizeExternalUrl} from "@/domain/utils/url";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import type {BrowserAdapter} from "@/adapters/driven/types";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";

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

        // `highlight()` opens by calling `clearHighlight()`, which clears AND
        // deletes this record's timeout, so a `timeouts.get(recordId)` lookup
        // here could never find one. The block that used to sit at this point
        // was harmless duplication, but it implied a stale-timer hazard that
        // `highlight()` has already handled — and the real handling is the part
        // worth keeping visible.
        highlight(recordId, color);

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
 * The subset of {@link MenuActionType} a row's DotMenu can dispatch — the six
 * ids `createHomeMenuItems`/`createCompanyMenuItems` actually emit.
 *
 * Narrowed via `Extract` rather than hand-written so a rename in
 * `MenuActionType` still breaks here. For a header-bar action, extend
 * `useHeaderBarActions` — not this file.
 */
export type RowMenuActionType = Extract<
    MenuActionType,
    "updateBooking" | "deleteBooking" | "updateStock" | "deleteStock" | "showDividend" | "openLink"
>;

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
    // `fetchAdapter` and `useOnlineStockData` were dependencies of the dead
    // `updateQuote` handler only. Quote refreshing lives in
    // `useHeaderBarActions`, which is where its dispatcher is.
    const {alertAdapter, browserAdapter, repositories} = useAdapters();

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
        const typedKey = key as Parameters<BrowserAdapter["getMessage"]>[0];
        if (!translate) {
            return browserAdapter.getMessage(typedKey);
        }
        const translated = translate(key);
        return translated && translated !== key ? translated : browserAdapter.getMessage(typedKey);
    };

    /**
     * Asks the user to confirm a destructive menu action.
     *
     * `feedbackConfirm` REJECTS (rather than resolving false) when a confirmation
     * dialog is already open — see stores/alerts.ts `confirm()` — so a rejection
     * here must be read as "not confirmed", not propagated: a second delete click
     * while the first prompt is up should quietly do nothing, not surface an
     * error about dialog state.
     *
     * The catch tests for that rejection specifically rather than absorbing
     * everything: a sink that cannot present the confirmation at all now throws
     * `ALERTS.SINK_UNAVAILABLE`, and reading *that* as "the user declined" is
     * the failure `alertAdapter.getAlertSinkOrThrow` exists to stop. It
     * propagates.
     *
     * Takes the already-resolved question rather than a key: `resolveMessage`
     * must be called at the call site with a string literal, or scripts/i18n-lint
     * cannot see the key and reports it as unused.
     *
     * @param message - The resolved question to ask.
     * @returns Whether the user explicitly confirmed.
     */
    const confirmDestructive = async (message: string): Promise<boolean> => {
        try {
            return !!(await alertAdapter.feedbackConfirm?.(
                resolveMessage("composables.useMenu.messages.confirmDeleteTitle"),
                message,
                {
                    confirm: {
                        confirmText: resolveMessage("composables.useMenu.messages.confirmOk"),
                        cancelText: resolveMessage("composables.useMenu.messages.confirmCancel"),
                        type: "warning"
                    }
                }
            ));
        } catch (err) {
            if (isConfirmDialogBusyError(err)) {
                log("COMPOSABLES useMenu: a confirmation is already open", err, "warn");
                return false;
            }
            throw err;
        }
    };

    /**
     * The actions this table can actually be asked for.
     *
     * `useMenuAction.executeAction` has exactly one dispatcher — `DotMenu.vue`,
     * whose `item.action` comes from `createHomeMenuItems` (updateBooking,
     * deleteBooking) or `createCompanyMenuItems` (updateStock, deleteStock,
     * showDividend, openLink). This table used to be an exhaustive
     * `Record<MenuActionType, …>` over all 23 members, so 17 of them were
     * unreachable duplicates of `useHeaderBarActions`' table, which has the
     * *other* dispatcher (`HeaderBar.vue`, 16 ids).
     *
     * They were not equivalent duplicates, which is what made the redundancy
     * cost something rather than merely being noise. The dead `updateQuote` was
     * ~25 lines of non-trivial logic — AbortController supersession, ref-counted
     * loading flags, cache clear — maintained in parallel with the live one, and
     * it called `refreshOnlineData(runtime.stocksPage)` **without `stockIds`**,
     * i.e. the positional page slice that `resolvePageStocks`' own doc comment
     * (`useOnlineStockData.ts:72-83`) identifies as wrong as soon as the user
     * sorts the table. That is the exact bug the `stockIds` parameter was added
     * to fix and which `CompanyContent.vue:289` passes. Wiring a per-row "update
     * quote" control to this table later would have silently reintroduced it.
     *
     * Narrowed via `Extract` rather than a hand-written union so a rename in
     * `MenuActionType` still breaks here. For a header-bar action, extend
     * `useHeaderBarActions` — not this file.
     */
    // Declared at module scope (below) so `hasAction` can narrow to it — a
    // predicate has to name the type it proves.

    const actionHandlers: Record<RowMenuActionType, ActionHandler> = {
        async updateBooking() {
            openDialog("updateBooking", true);
        },

        async deleteBooking(recordId: number) {
            // Deleting a booking is irreversible and sits one click deep in a row's
            // DotMenu, with no undo. Every other destructive action in the app
            // already confirms first (deleteAccount routes through
            // DeleteAccountConfirmation; HomeContent's reset-storage shortcut got a
            // confirmation for exactly this reason); this one did not.
            if (!(await confirmDestructive(
                resolveMessage("composables.useMenu.messages.confirmDeleteBooking")
            ))) {
                return;
            }

            await removeBookingUsecase(
                {repositories, records: toRecordsPort(records), runtime},
                {bookingId: recordId}
            );
            await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.delete"));
        },

        // Stock Actions
        async updateStock() {
            openDialog("updateStock", true);
        },

        async deleteStock(recordId: number) {
            if (checkStockHasBookings(recordId)) {
                await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.noDelete"));
                return;
            }

            // Same reasoning as deleteBooking. The bookings check above only
            // rules out deleting a stock that still has history — it is not a
            // confirmation, and says nothing to a user who clicked by accident.
            if (!(await confirmDestructive(
                resolveMessage("composables.useMenu.messages.confirmDeleteStock")
            ))) {
                return;
            }

            // `canDelete` re-runs the same check as the pre-check above, and
            // that repetition is deliberate: the pre-check is what lets this
            // handler show a specific "cannot delete" message instead of a
            // generic failure, while the predicate is what makes the invariant
            // hold for every caller of the usecase, including ones that do not
            // exist yet. It also re-reads the store at operation time rather
            // than at click time.
            const result = await removeStockUsecase(
                {repositories, records: toRecordsPort(records), runtime},
                {stockId: recordId, canDelete: (id) => !checkStockHasBookings(id)}
            );

            if (result.status === "not_allowed") {
                await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.noDelete"));
                return;
            }

            await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.delete"));
        },

        // Info & Display Actions
        async showDividend() {
            openDialog("showDividend", false);
        },

        async openLink(recordId: number) {
            const stock = records.stocks.getById(recordId);
            // Fail closed. `cURL` is an arbitrary user- or backup-supplied
            // string that no layer used to scheme-check before it reached
            // `window.open` — see `sanitizeExternalUrl`. A rejected URL takes
            // the same "no link" path as an absent one, which is honest: from
            // the user's side there is no usable link either way.
            const url = sanitizeExternalUrl(stock?.cURL);

            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
            } else {
                await alertAdapter.feedbackInfo(resolveMessage("composables.useMenu.title"), resolveMessage("composables.useMenu.messages.noLink"));
            }
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

        // Widened lookup, because `actionHandlers` now covers only the row-level
        // actions while the parameter stays the full `MenuActionType` that
        // `MenuItemData.action` is typed as. The `!handler` branch below used to
        // be unreachable (the table was exhaustive); it is now the real answer
        // for a header-bar action id sent to the row dispatcher.
        const handler = (actionHandlers as Partial<Record<MenuActionType, ActionHandler>>)[actionType];

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
     * Type guard that checks whether a string is a **row-level** menu action —
     * one this composable can actually dispatch.
     *
     * Narrows to {@link RowMenuActionType}, not `MenuActionType`. It used to
     * claim the full union while testing membership in `actionHandlers`, which
     * covers only these six of the union's 23 members — so it returned `false`
     * for `"home"`, `"addStock"`, `"exportDatabase"` and the rest while telling
     * TypeScript that a `false` meant "not a `MenuActionType` at all". A caller
     * writing `if (hasAction(x)) … else …` would have had `x` narrowed to
     * `never`-adjacent nonsense in the `else`, for a value that is a perfectly
     * good menu action handled elsewhere.
     *
     * The runtime answer is unchanged and is the intended one; only the type it
     * proves was wrong. See the tests in `useMenu.test.ts`, which pin exactly
     * this row-only behaviour.
     *
     * @param actionType - Candidate action key.
     */
    const hasAction = (actionType: string): actionType is RowMenuActionType => {
        return actionType in actionHandlers;
    };

    return {
        executeAction,
        hasAction
    };
}

log("COMPOSABLES useMenu");
