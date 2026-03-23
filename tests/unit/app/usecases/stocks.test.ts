/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
import {addStockUsecase, updateStockUsecase} from "@/app/usecases/stocks";
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
    });
});
