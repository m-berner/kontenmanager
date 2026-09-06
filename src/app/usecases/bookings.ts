/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {PersistDeps} from "@/app/usecases/ports";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {BookingDb} from "@/domain/types";
import {isValidISODate} from "@/domain/utils/utils";

export type AddBookingUsecaseDeps = PersistDeps;

export type RemoveBookingUsecaseDeps = PersistDeps;

export type UpdateBookingUsecaseDeps = PersistDeps;

export async function addBookingUsecase(
    deps: AddBookingUsecaseDeps,
    input: {
        bookingData: Omit<BookingDb, "cID">;
    }
): Promise<{ id: number }> {
    // Mirrors addStockUsecase's guard, which bookings were missing. Every
    // booking belongs to an account; `cAccountNumberID` carries the active
    // account id as of form-mapping time, so a non-positive one means no account
    // was selected and saving would create a record no account view can reach.
    //
    // Not merely untidy: exportDatabaseUsecase refuses to write ANYTHING while
    // findExportConsistencyIssues counts a booking whose cAccountNumberID is not
    // a known account, so a single orphan blocks every future export of the whole
    // database — and no UI can remove it, since healthChecker.repairDatabase is
    // deliberately unwired. validateBooking doesn't catch this either: it warns
    // only for exactly 0, so -1 passed through silently.
    if (!Number.isInteger(input.bookingData.cAccountNumberID) || input.bookingData.cAccountNumberID <= 0) {
        throw appError(
            "xx_no_active_account",
            ERROR_CATEGORY.VALIDATION,
            true,
            {entity: "booking"}
        );
    }

    // `validateBooking` will not stop a blank date: its `normalizeDate` maps a
    // missing or malformed value to `""` on purpose, to avoid silently dating
    // the record "today". That is the right call for an import, where the
    // alternative is inventing data — but on the add path there is a user at a
    // form who can supply the real date, and a booking that reaches the store
    // undated is counted by the all-time totals while belonging to no year.
    // Reject it here so the only undated bookings in a database are ones that
    // arrived with a backup the user explicitly confirmed importing — the one
    // remaining path, and the one place the question is asked.
    if (!isValidISODate(input.bookingData.cBookDate)) {
        throw appError(
            "xx_blank_book_date",
            ERROR_CATEGORY.VALIDATION,
            true,
            {entity: "booking"}
        );
    }

    const addBookingID = await deps.repositories.bookings.save(input.bookingData);

    if (addBookingID === INDEXED_DB.INVALID_ID) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {entity: "booking"}
        );
    }

    deps.records.bookings.add({...input.bookingData, cID: addBookingID}, true);
    // Deliberately no `resetTeleport()` here, unlike the other write usecases:
    // AddBooking.vue keeps its dialog open after a save and just clears the
    // form, because bookings are typically entered several at a time.
    //
    // A new booking changes the stock's holdings (mPortfolio), the secondary
    // sort key behind stock paging.
    deps.runtime.clearStocksPages();
    return {id: addBookingID};
}

export async function removeBookingUsecase(
    deps: RemoveBookingUsecaseDeps,
    input: { bookingId: number }
): Promise<void> {
    await deps.repositories.bookings.delete(input.bookingId);
    deps.records.bookings.remove(input.bookingId);
    deps.runtime.resetTeleport();
    // Removing a booking changes the stock's holdings (mPortfolio).
    deps.runtime.clearStocksPages();
}

export async function updateBookingUsecase(
    deps: UpdateBookingUsecaseDeps,
    input: { booking: BookingDb }
): Promise<void> {
    // Same guard as the add path. Without it the invariant would hold only for
    // new bookings: an imported undated booking opened in UpdateBooking and
    // saved would keep its blank date, and a dated booking could be edited into
    // an undated one, so blank dates could still enter the store through a form.
    if (!isValidISODate(input.booking.cBookDate)) {
        throw appError(
            "xx_blank_book_date",
            ERROR_CATEGORY.VALIDATION,
            true,
            {entity: "booking"}
        );
    }

    await deps.repositories.bookings.save(input.booking);
    deps.records.bookings.update(input.booking);
    deps.runtime.resetTeleport();
    // A changed amount or count changes the stock's holdings (mPortfolio).
    deps.runtime.clearStocksPages();
}
