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

    it("updateBookingTypeUsecase short-circuits when the new cRole collides with another booking type in the same account", async () => {
        const save = vi.fn();
        // The account's existing types are seeded on the REPOSITORY, not on the
        // records store: the store holds only the ACTIVE account's types, so
        // filtering it by cAccountNumberID read as account-agnostic while being
        // correct only by an invariant the usecase never asserted.
        const records = createRecordsPortMock();

        const res = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({
                    bookingTypes: {
                        save,
                        findByAccount: vi.fn().mockResolvedValue([
                            {cID: 1, cAccountNumberID: 1, cRole: "buy", cName: "A"},
                            {cID: 2, cAccountNumberID: 1, cRole: "sell", cName: "B"}
                        ])
                    }
                }),
                records,
                runtime: createRuntimePortMock()
            },
            {
                // Renaming type 2 but (e.g. via a stale in-dialog selection) its
                // role now collides with type 1's, which already has "buy".
                bookingType: {...makeBookingTypeDb({cID: 2, cName: "B"}), cAccountNumberID: 1, cRole: "buy"},
                isDuplicateName: () => false
            }
        );

        expect(save).not.toHaveBeenCalled();
        expect(res).toEqual({status: "roleConflict"});
    });

    it("updateBookingTypeUsecase invalidates the stocks page cache only when it actually writes", async () => {
        const records = createRecordsPortMock();

        // Success path: a role change repositions stocks, so the cache must go.
        const onUpdate = createRuntimePortMock();
        const updated = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock(),
                records,
                runtime: onUpdate
            },
            {
                bookingType: {...makeBookingTypeDb({cID: 1, cName: "A"}), cAccountNumberID: 1, cRole: "buy"},
                isDuplicateName: () => false
            }
        );

        expect(updated).toEqual({status: "updated"});
        expect(onUpdate.clearStocksPages).toHaveBeenCalledTimes(1);

        // Rejected path: nothing was written, so nothing may be invalidated.
        const onDuplicate = createRuntimePortMock();
        const rejected = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock(),
                records,
                runtime: onDuplicate
            },
            {
                bookingType: makeBookingTypeDb({cID: 1, cName: "A"}),
                isDuplicateName: () => true
            }
        );

        expect(rejected).toEqual({status: "duplicate"});
        expect(onDuplicate.clearStocksPages).not.toHaveBeenCalled();
    });

    it("updateBookingTypeUsecase allows multiple 'other'-role booking types in the same account", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const records = createRecordsPortMock();

        const res = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({bookingTypes: {save}}),
                records,
                runtime: createRuntimePortMock()
            },
            {
                bookingType: {...makeBookingTypeDb({cID: 2, cName: "B"}), cAccountNumberID: 1, cRole: "other"},
                isDuplicateName: () => false
            }
        );

        expect(save).toHaveBeenCalledTimes(1);
        expect(res).toEqual({status: "updated"});
    });

    it("updateBookingTypeUsecase does not conflict with a booking type's own unchanged role", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const records = createRecordsPortMock();

        const res = await updateBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({
                    bookingTypes: {
                        save,
                        // The account's stored types include the very record
                        // being updated, which is what makes the `cID !== …`
                        // exclusion load-bearing: without it, renaming a type
                        // would report its own role as a conflict with itself.
                        findByAccount: vi.fn().mockResolvedValue([
                            {cID: 1, cAccountNumberID: 1, cRole: "buy", cName: "Original"}
                        ])
                    }
                }),
                records,
                runtime: createRuntimePortMock()
            },
            {
                bookingType: {...makeBookingTypeDb({cID: 1, cName: "Renamed"}), cAccountNumberID: 1, cRole: "buy"},
                isDuplicateName: () => false
            }
        );

        expect(save).toHaveBeenCalledTimes(1);
        expect(res).toEqual({status: "updated"});
    });

    it("deleteBookingTypeUsecase short-circuits if it cannot delete", async () => {
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

    it("deleteBookingTypeUsecase refuses to delete a role-carrying type even when no booking uses it", async () => {
        // The state a freshly created depot account is in: Buy/Sell/Dividend
        // exist, nothing references them yet, so `canDelete` says yes. Deleting
        // Buy would leave `resolveTypeIdByRole` returning undefined and no stock
        // booking could be recorded for that account any more.
        const del = vi.fn();

        const res = await deleteBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({
                    bookingTypes: {
                        delete: del,
                        findById: vi.fn().mockResolvedValue(
                            {...makeBookingTypeDb({cID: 2, cName: "Kauf"}), cRole: "buy"}
                        )
                    }
                }),
                records: createRecordsPortMock(),
                runtime: createRuntimePortMock()
            },
            {
                bookingTypeId: 2,
                canDelete: () => true
            }
        );

        expect(del).not.toHaveBeenCalled();
        expect(res).toEqual({status: "roleProtected"});
    });

    it("deleteBookingTypeUsecase deletes an 'other'-role type", async () => {
        // The counterpart: multiple custom types are fine, so `other` carries no
        // invariant and the guard must not block it.
        const del = vi.fn().mockResolvedValue(undefined);
        const runtime = createRuntimePortMock();

        const res = await deleteBookingTypeUsecase(
            {
                repositories: createRepositoriesPortMock({
                    bookingTypes: {
                        delete: del,
                        findById: vi.fn().mockResolvedValue(
                            {...makeBookingTypeDb({cID: 3, cName: "Zinsen"}), cRole: "other"}
                        )
                    }
                }),
                records: createRecordsPortMock(),
                runtime
            },
            {
                bookingTypeId: 3,
                canDelete: () => true
            }
        );

        expect(del).toHaveBeenCalledWith(3);
        expect(res).toEqual({status: "deleted"});
        expect(runtime.resetTeleport).toHaveBeenCalledTimes(1);
    });

    it("addBookingTypeUsecase refuses to persist a type with no active account", async () => {
        // Orphaned booking types are counted by findExportConsistencyIssues too,
        // so one is enough to block every future database export.
        const save = vi.fn();
        const {cID: _cID, ...bookingTypeData} = makeBookingTypeDb({cAccountNumberID: -1});

        await expect(
            addBookingTypeUsecase(
                {
                    repositories: createRepositoriesPortMock({bookingTypes: {save}}),
                    records: createRecordsPortMock()
                },
                {bookingTypeData, isDuplicateName: () => false}
            )
        ).rejects.toThrow();

        expect(save).not.toHaveBeenCalled();
    });
});
