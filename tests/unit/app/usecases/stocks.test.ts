/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
import {addStockUsecase, removeStockUsecase, updateStockUsecase} from "@/app/usecases/stocks";
import {createRecordsPortMock, createRepositoriesPortMock, createRuntimePortMock, makeStockDb} from "@test/usecases";

describe("usecases/stocks", () => {
    it("addStockUsecase saves stock and adds it to records", async () => {
        const save = vi.fn().mockResolvedValue(5);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();
        const {cID: _cID, ...stockData} = makeStockDb({cAccountNumberID: 1});

        const res = await addStockUsecase(
            {
                repositories: createRepositoriesPortMock({stocks: {save}}),
                records,
                runtime,
                stocksPage: 3
            },
            {
                stockData
            }
        );

        expect(save).toHaveBeenCalled();
        expect(records.stocks.add).toHaveBeenCalledWith(expect.objectContaining({cID: 5}));
        expect(runtime.resetTeleport).toHaveBeenCalledTimes(1);
        expect(res).toEqual({id: 5, page: 3});
    });

    it("addStockUsecase throws on INVALID_ID", async () => {
        const save = vi.fn().mockResolvedValue(INDEXED_DB.INVALID_ID);
        const {cID: _cID, ...stockData} = makeStockDb({cAccountNumberID: 1});
        await expect(
            addStockUsecase(
                {
                    repositories: createRepositoriesPortMock({stocks: {save}}),
                    records: createRecordsPortMock(),
                    runtime: createRuntimePortMock(),
                    stocksPage: 1
                },
                {
                    stockData
                }
            )
        ).rejects.toThrow();
    });

    it("updateStockUsecase updates records, saves and resets teleport", async () => {
        const save = vi.fn().mockResolvedValue(1);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        await updateStockUsecase(
            {
                repositories: createRepositoriesPortMock({stocks: {save}}),
                records,
                runtime
            },
            {stock: makeStockDb({cID: 1})}
        );

        expect(records.stocks.update).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
    });

    it.each([0, -1])(
        "addStockUsecase rejects a stock with no active account (cAccountNumberID %i)",
        async (accountId) => {
            const save = vi.fn().mockResolvedValue(5);
            const records = createRecordsPortMock();
            const {cID: _cID, ...stockData} = makeStockDb({cAccountNumberID: accountId});

            await expect(
                addStockUsecase(
                    {
                        repositories: createRepositoriesPortMock({stocks: {save}}),
                        records,
                        runtime: createRuntimePortMock(),
                        stocksPage: 1
                    },
                    {stockData}
                )
            ).rejects.toThrow();

            // Rejected before touching the database, so no orphaned record and
            // no in-memory record that the DB does not have.
            expect(save).not.toHaveBeenCalled();
            expect(records.stocks.add).not.toHaveBeenCalled();
        }
    );

    it("addStockUsecase invalidates the stocks page cache after a successful add", async () => {
        const runtime = createRuntimePortMock();
        const {cID: _cID, ...stockData} = makeStockDb({cAccountNumberID: 1});

        await addStockUsecase(
            {
                repositories: createRepositoriesPortMock({stocks: {save: vi.fn().mockResolvedValue(5)}}),
                records: createRecordsPortMock(),
                runtime,
                stocksPage: 2
            },
            {stockData}
        );

        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
    });

    it("removeStockUsecase deletes, updates records and invalidates the stocks page cache", async () => {
        const del = vi.fn().mockResolvedValue(undefined);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        const res = await removeStockUsecase(
            {
                repositories: createRepositoriesPortMock({stocks: {delete: del}}),
                records,
                runtime
            },
            {stockId: 3, canDelete: () => true}
        );

        expect(res).toEqual({status: "deleted"});
        expect(del).toHaveBeenCalledWith(3);
        expect(records.stocks.remove).toHaveBeenCalledWith(3);
        expect(runtime.resetTeleport).toHaveBeenCalled();
        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
    });

    // The invariant now lives in the usecase, injected the same way
    // `deleteBookingTypeUsecase` injects its own. It used to be enforced twice in
    // the ADAPTER layer (useMenu.deleteStock's hasBookings check and
    // portfolio.active's mDeleteable flag) and not at all here, so any second
    // call site reached the delete unprotected — and a booking left pointing at
    // a deleted stock passes the health check, passes the export, and is only
    // rejected on re-import: the app produced a database it could not restore
    // from its own backup.
    it("removeStockUsecase refuses and writes nothing when canDelete says no", async () => {
        const del = vi.fn().mockResolvedValue(undefined);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        const res = await removeStockUsecase(
            {
                repositories: createRepositoriesPortMock({stocks: {delete: del}}),
                records,
                runtime
            },
            {stockId: 3, canDelete: () => false}
        );

        expect(res).toEqual({status: "not_allowed"});
        expect(del).not.toHaveBeenCalled();
        expect(records.stocks.remove).not.toHaveBeenCalled();
        expect(runtime.resetTeleport).not.toHaveBeenCalled();
        expect(runtime.clearStocksPages).not.toHaveBeenCalled();
    });

    it("removeStockUsecase passes the stock id to the predicate", async () => {
        const canDelete = vi.fn().mockReturnValue(true);

        await removeStockUsecase(
            {
                repositories: createRepositoriesPortMock(),
                records: createRecordsPortMock(),
                runtime: createRuntimePortMock()
            },
            {stockId: 42, canDelete}
        );

        expect(canDelete).toHaveBeenCalledWith(42);
    });
});
