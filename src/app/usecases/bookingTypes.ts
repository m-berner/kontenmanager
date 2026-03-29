/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {PersistDeps, RecordsPort, RepositoriesPort} from "@/app/usecases/ports";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {BookingTypeDb} from "@/domain/types";

export type AddBookingTypeUsecaseDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
};

export type DeleteBookingTypeUsecaseDeps = PersistDeps;

export type UpdateBookingTypeUsecaseDeps = PersistDeps;

export async function addBookingTypeUsecase(
    deps: AddBookingTypeUsecaseDeps,
    input: {
        bookingTypeData: Omit<BookingTypeDb, "cID">;
        isDuplicateName: (name: string) => boolean;
    }
): Promise<{ status: "duplicate" } | { status: "added"; id: number }> {
    if (input.isDuplicateName(input.bookingTypeData.cName)) {
        return {status: "duplicate"};
    }

    const id = await deps.repositories.bookingTypes.save(input.bookingTypeData);

    if (id === INDEXED_DB.INVALID_ID) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {entity: "bookingType"}
        );
    }

    deps.records.bookingTypes.add({...input.bookingTypeData, cID: id});
    return {status: "added", id};
}

export async function deleteBookingTypeUsecase(
    deps: DeleteBookingTypeUsecaseDeps,
    input: {
        bookingTypeId: number;
        canDelete: (bookingTypeId: number) => boolean;
    }
): Promise<{ status: "not_allowed" } | { status: "deleted" }> {
    if (!input.canDelete(input.bookingTypeId)) {
        return {status: "not_allowed"};
    }

    await deps.repositories.bookingTypes.delete(input.bookingTypeId);
    deps.records.bookingTypes.remove(input.bookingTypeId);
    deps.runtime.resetTeleport();
    return {status: "deleted"};
}

export async function updateBookingTypeUsecase(
    deps: UpdateBookingTypeUsecaseDeps,
    input: {
        bookingType: BookingTypeDb;
        isDuplicateName: (name: string, id: number) => boolean;
    }
): Promise<{ status: "duplicate" } | { status: "updated" }> {
    if (input.isDuplicateName(input.bookingType.cName, input.bookingType.cID)) {
        return {status: "duplicate"};
    }

    await deps.repositories.bookingTypes.save(input.bookingType);
    deps.records.bookingTypes.update(input.bookingType);
    deps.runtime.resetTeleport();
    return {status: "updated"};
}
