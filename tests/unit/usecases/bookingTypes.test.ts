/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {addBookingTypeUsecase, deleteBookingTypeUsecase, updateBookingTypeUsecase} from "@/app/usecases/bookingTypes";
import {
    createRecordsPortMock,
    createRepositoriesPortMock,
    createRuntimePortMock,
    makeBookingTypeDb
} from "@test/usecases";

describe("usecases/bookingTypes", () => {
    it("addBookingTypeUsecase short-circuits on duplicate", async () => {
        const save = vi.fn();
        const {cID: _cID, ...bookingTypeData} = makeBookingTypeDb({cName: "A"});

        const res = await addBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({bookingTypes: {save}}),
                records: createRecordsPortMock()
            },
            {
                bookingTypeData,
                isDuplicateName: () => true,
            }
        );

        expect(save).not.toHaveBeenCalled();
        expect(res).toEqual({status: "duplicate"});
    });

    it("updateBookingTypeUsecase short-circuits on duplicate", async () => {
        const save = vi.fn();

        const res = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({bookingTypes: {save}}),
                records: createRecordsPortMock(),
                runtime: createRuntimePortMock()
            },
            {
                bookingType: makeBookingTypeDb({cID: 1, cName: "A"}),
                isDuplicateName: () => true
            }
        );

        expect(save).not.toHaveBeenCalled();
        expect(res).toEqual({status: "duplicate"});
    });

    it("deleteBookingTypeUsecase short-circuits if cannot delete", async () => {
        const del = vi.fn();

        const res = await deleteBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({bookingTypes: {delete: del}}),
                records: createRecordsPortMock(),
                runtime: createRuntimePortMock()
            },
            {
                bookingTypeId: 2,
                canDelete: () => false
            }
        );

        expect(del).not.toHaveBeenCalled();
        expect(res).toEqual({status: "not_allowed"});
    });
});
