/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {PersistDeps, RecordsPort, RepositoriesPort, RuntimePort} from "@/app/usecases/ports";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {StockDb} from "@/domain/types";

export type AddStockUsecaseDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
    runtime: RuntimePort;
    stocksPage: number;
};

export type RemoveStockUsecaseDeps = PersistDeps;

export type UpdateStockUsecaseDeps = PersistDeps;

export async function addStockUsecase(
    deps: AddStockUsecaseDeps,
    input: {
        stockData: Omit<StockDb, "cID">;
    }
): Promise<{ id: number; page: number }> {
    // Every stock belongs to an account. `cAccountNumberID` carries the active
    // account id as of form-mapping time, so an unset or invalid one means no
    // account was selected and saving would create an orphaned record that no
    // account view can reach.
    if (!Number.isInteger(input.stockData.cAccountNumberID) || input.stockData.cAccountNumberID <= 0) {
        throw appError(
            "xx_no_active_account",
            ERROR_CATEGORY.VALIDATION,
            true,
            {entity: "stock"}
        );
    }

    const id = await deps.repositories.stocks.save(input.stockData);

    if (id === INDEXED_DB.INVALID_ID) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {entity: "stock"}
        );
    }

    deps.records.stocks.add({...input.stockData, cID: id});
    deps.runtime.resetTeleport();
    // A brand-new stock has no holdings yet, so it sorts to the end of its
    // cFirstPage group and may land on a page other than the one being viewed.
    deps.runtime.clearStocksPages();
    return {id, page: deps.stocksPage};
}

/**
 * Deletes a stock, refusing when bookings still reference it.
 *
 * The `canDelete` predicate is injected exactly as `deleteBookingTypeUsecase`
 * injects its own, and for the same reason: the invariant belongs where the
 * write happens, while the store-specific `hasBookings` lookup belongs to the
 * caller. This was the only deletion in the layer that trusted its callers —
 * `deleteActiveAccountUsecase` cascades, `deleteBookingTypeUsecase` takes this
 * predicate — even though its own add-path siblings (`addStockUsecase` above,
 * `addBookingUsecase`) both guard their referential invariant inline.
 *
 * The invariant was enforced twice in the adapter layer (`useMenu.deleteStock`
 * runs the domain's `hasBookings`, and `portfolio.active` computes
 * `mDeleteable` for the control's enabled state) and not at all here, so any
 * second call site — a keyboard shortcut, a bulk action, a test harness —
 * reached this function unprotected.
 *
 * What that cost is worth stating, because it is not merely untidy. A booking
 * left pointing at a deleted stock passes `healthChecker.performHealthCheck`
 * and passes `findExportConsistencyIssues`, so the backup file writes
 * successfully — and is then **rejected on import** by `validateForeignKeys`.
 * The app produced a database it could not restore from its own backup, and the
 * user found out at the worst possible moment, potentially after the original
 * was gone. (The three integrity checks now share one implementation, so the
 * export catches it too; this guard is what stops it being created.)
 *
 * @returns `{status: "not_allowed"}` when the predicate refuses, leaving the
 *   database untouched; `{status: "deleted"}` otherwise.
 */
export async function removeStockUsecase(
    deps: RemoveStockUsecaseDeps,
    input: {
        stockId: number;
        canDelete: (_stockId: number) => boolean;
    }
): Promise<{ status: "not_allowed" } | { status: "deleted" }> {
    if (!input.canDelete(input.stockId)) {
        return {status: "not_allowed"};
    }

    await deps.repositories.stocks.delete(input.stockId);
    deps.records.stocks.remove(input.stockId);
    deps.runtime.resetTeleport();
    // Removing a stock shifts every later stock one position forward.
    deps.runtime.clearStocksPages();
    return {status: "deleted"};
}

export async function updateStockUsecase(
    deps: UpdateStockUsecaseDeps,
    input: { stock: StockDb }
): Promise<void> {
    await deps.repositories.stocks.save(input.stock);
    deps.records.stocks.update(input.stock);
    deps.runtime.resetTeleport();
    // Editing cFirstPage or cFadeOut can move this stock to a different page.
    deps.runtime.clearStocksPages();
}
