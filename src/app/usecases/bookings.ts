/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {PersistDeps, RecordsPort, RepositoriesPort} from "@/app/usecases/ports";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {BookingDb} from "@/domain/types";

export type AddBookingUsecaseDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
};

export type UpdateBookingUsecaseDeps = PersistDeps;

export async function addBookingUsecase(
    deps: AddBookingUsecaseDeps,
    input: {
        bookingData: Omit<BookingDb, "cID">;
    }
): Promise<{ id: number }> {
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
    return {id: addBookingID};
}

export async function updateBookingUsecase(
    deps: UpdateBookingUsecaseDeps,
    input: { booking: BookingDb }
): Promise<void> {
    deps.records.bookings.update(input.booking);
    await deps.repositories.bookings.save(input.booking);
    deps.runtime.resetTeleport();
}
