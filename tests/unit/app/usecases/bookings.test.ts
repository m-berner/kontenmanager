/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
import {addBookingUsecase, updateBookingUsecase} from "@/app/usecases/bookings";
import {createRecordsPortMock, createRepositoriesPortMock, createRuntimePortMock, makeBookingDb} from "@test/usecases";

describe("usecases/bookings", () => {
    it("addBookingUsecase saves booking and adds it to records", async () => {
        const save = vi.fn().mockResolvedValue(7);
        const records = createRecordsPortMock();
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1});

        const res = await addBookingUsecase(
            {
                repositories: createRepositoriesPortMock({bookings: {save}}),
                records
            },
            {
                bookingData
            }
        );

        expect(save).toHaveBeenCalled();
        expect(records.bookings.add).toHaveBeenCalledWith(expect.objectContaining({cID: 7}), true);
        expect(res).toEqual({id: 7});
    });

    it("addBookingUsecase throws on INVALID_ID", async () => {
        const save = vi.fn().mockResolvedValue(INDEXED_DB.INVALID_ID);
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1});
        await expect(
            addBookingUsecase(
                {
                    repositories: createRepositoriesPortMock({bookings: {save}}),
                    records: createRecordsPortMock()
                },
                {
                    bookingData
                }
            )
        ).rejects.toThrow();
    });

    it("updateBookingUsecase updates records, saves and resets teleport", async () => {
        const save = vi.fn().mockResolvedValue(1);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        await updateBookingUsecase(
            {
                repositories: createRepositoriesPortMock({bookings: {save}}),
                records,
                runtime
            },
            {booking: makeBookingDb({cID: 1})}
        );

        expect(records.bookings.update).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
    });
});
