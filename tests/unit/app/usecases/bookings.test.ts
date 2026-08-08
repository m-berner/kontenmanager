/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
import {addBookingUsecase, removeBookingUsecase, updateBookingUsecase} from "@/app/usecases/bookings";
import {createRecordsPortMock, createRepositoriesPortMock, createRuntimePortMock, makeBookingDb} from "@test/usecases";

describe("usecases/bookings", () => {
    it("addBookingUsecase saves booking and adds it to records", async () => {
        const save = vi.fn().mockResolvedValue(7);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1});

        const res = await addBookingUsecase(
            {
                repositories: createRepositoriesPortMock({bookings: {save}}),
                records,
                runtime
            },
            {
                bookingData
            }
        );

        expect(save).toHaveBeenCalled();
        expect(records.bookings.add).toHaveBeenCalledWith(expect.objectContaining({cID: 7}), true);
        expect(res).toEqual({id: 7});
    });

    it("addBookingUsecase invalidates the stocks page cache but leaves the dialog open", async () => {
        const runtime = createRuntimePortMock();
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1});

        await addBookingUsecase(
            {
                repositories: createRepositoriesPortMock({bookings: {save: vi.fn().mockResolvedValue(7)}}),
                records: createRecordsPortMock(),
                runtime
            },
            {bookingData}
        );

        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
        // Bookings are typically entered several at a time, so AddBooking.vue
        // keeps its dialog open and only clears the form.
        expect(runtime.resetTeleport).not.toHaveBeenCalled();
    });

    it("addBookingUsecase throws on INVALID_ID", async () => {
        const save = vi.fn().mockResolvedValue(INDEXED_DB.INVALID_ID);
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1});
        await expect(
            addBookingUsecase(
                {
                    repositories: createRepositoriesPortMock({bookings: {save}}),
                    records: createRecordsPortMock(),
                    runtime: createRuntimePortMock()
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
        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
    });

    it("removeBookingUsecase deletes, updates records and invalidates the stocks page cache", async () => {
        const del = vi.fn().mockResolvedValue(undefined);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        await removeBookingUsecase(
            {
                repositories: createRepositoriesPortMock({bookings: {delete: del}}),
                records,
                runtime
            },
            {bookingId: 4}
        );

        expect(del).toHaveBeenCalledWith(4);
        expect(records.bookings.remove).toHaveBeenCalledWith(4);
        expect(runtime.resetTeleport).toHaveBeenCalled();
        expect(runtime.clearStocksPages).toHaveBeenCalledTimes(1);
    });

    // An orphaned booking (one whose account doesn't exist) is counted by
    // findExportConsistencyIssues, which makes exportDatabaseUsecase throw before
    // writing anything — so a single one blocks EVERY future export of the whole
    // database, with no UI able to remove it. addStockUsecase already guarded
    // against this; bookings did not.
    it.each([
        ["the no-active-account sentinel", -1],
        ["zero", 0],
        ["a non-integer", 1.5]
    ])("addBookingUsecase refuses to persist a booking whose account id is %s", async (_label, accountId) => {
        const save = vi.fn().mockResolvedValue(7);
        const records = createRecordsPortMock();
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: accountId});

        await expect(
            addBookingUsecase(
                {
                    repositories: createRepositoriesPortMock({bookings: {save}}),
                    records,
                    runtime: createRuntimePortMock()
                },
                {bookingData}
            )
        ).rejects.toThrow();

        // Nothing may reach the database or the in-memory store.
        expect(save).not.toHaveBeenCalled();
        expect(records.bookings.add).not.toHaveBeenCalled();
    });

    // validateBooking does NOT catch this: its normalizeDate deliberately maps a
    // missing or malformed date to "" rather than defaulting to today, so an
    // undated booking saves successfully and is then counted by the all-time
    // totals while belonging to no calendar year.
    it.each([
        ["blank", ""],
        ["a non-ISO format", "15.03.2024"],
        ["a non-date string", "tomorrow"]
    ])("addBookingUsecase refuses to persist a booking whose date is %s", async (_label, bookDate) => {
        const save = vi.fn().mockResolvedValue(7);
        const records = createRecordsPortMock();
        const {cID: _cID, ...bookingData} = makeBookingDb({cAccountNumberID: 1, cBookDate: bookDate});

        await expect(
            addBookingUsecase(
                {
                    repositories: createRepositoriesPortMock({bookings: {save}}),
                    records,
                    runtime: createRuntimePortMock()
                },
                {bookingData}
            )
        ).rejects.toThrow();

        expect(save).not.toHaveBeenCalled();
        expect(records.bookings.add).not.toHaveBeenCalled();
    });

    // Guarded on update too, or the invariant would hold only for new bookings:
    // an imported undated booking could be re-saved from the form unchanged, and
    // a dated booking could be edited into an undated one.
    it("updateBookingUsecase refuses to persist a booking whose date is blank", async () => {
        const save = vi.fn().mockResolvedValue(1);
        const records = createRecordsPortMock();

        await expect(
            updateBookingUsecase(
                {
                    repositories: createRepositoriesPortMock({bookings: {save}}),
                    records,
                    runtime: createRuntimePortMock()
                },
                {booking: makeBookingDb({cID: 1, cBookDate: ""})}
            )
        ).rejects.toThrow();

        expect(save).not.toHaveBeenCalled();
        expect(records.bookings.update).not.toHaveBeenCalled();
    });
});
