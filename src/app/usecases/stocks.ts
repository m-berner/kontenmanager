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

export type UpdateStockUsecaseDeps = PersistDeps;

export async function addStockUsecase(
    deps: AddStockUsecaseDeps,
    input: {
        stockData: Omit<StockDb, "cID">;
    }
): Promise<{ id: number; page: number }> {
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
    return {id, page: deps.stocksPage};
}

export async function updateStockUsecase(
    deps: UpdateStockUsecaseDeps,
    input: { stock: StockDb }
): Promise<void> {
    await deps.repositories.stocks.save(input.stock);
    deps.records.stocks.update(input.stock);
    deps.runtime.resetTeleport();
}
