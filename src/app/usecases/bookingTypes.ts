/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {PersistDeps, RecordsPort, RepositoriesPort} from "@/app/usecases/ports";

import {BOOKING_TYPE_ROLE, ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
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
    // Same guard, same reason as addBookingUsecase/addStockUsecase: an orphaned
    // booking type (one whose account doesn't exist) is counted by
    // findExportConsistencyIssues and permanently blocks every database export.
    if (!Number.isInteger(input.bookingTypeData.cAccountNumberID) || input.bookingTypeData.cAccountNumberID <= 0) {
        throw appError(
            "xx_no_active_account",
            ERROR_CATEGORY.VALIDATION,
            true,
            {entity: "bookingType"}
        );
    }

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
): Promise<{ status: "not_allowed" } | { status: "roleProtected" } | { status: "deleted" }> {
    if (!input.canDelete(input.bookingTypeId)) {
        return {status: "not_allowed"};
    }

    // A Buy/Sell/Dividend type must stay resolvable for as long as the account
    // is depot-enabled — the mirror image of updateBookingTypeUsecase's
    // roleConflict guard, which exists because `resolveTypeIdByRole`
    // (domain/logic.ts) has to find exactly one type per role.
    //
    // Without this, the account's Buy type could be deleted whenever no booking
    // referenced it yet — precisely the state a freshly created depot account is
    // in — and `resolveTypeIdByRole` would then return `undefined`, so
    // `mapBookingFormToDb`'s `isStockRelated` is false for every remaining type
    // and BookingForm hides the stock picker and the count field outright. The
    // account still advertises itself as depot-enabled while no purchase can be
    // recorded any more, and nothing tells the user why. Recovery existed but
    // was undiscoverable: the add dialog has no role control, so a re-created
    // type is always `other`; only toggling `withDepot` off and on again
    // re-runs `createDefaultBookingTypes`.
    //
    // `canDelete` is left as-is and checked first: "bookings are assigned" is
    // the more specific answer when both apply.
    const bookingType = await deps.repositories.bookingTypes.findById(input.bookingTypeId);
    if (bookingType && bookingType.cRole !== BOOKING_TYPE_ROLE.OTHER) {
        return {status: "roleProtected"};
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
): Promise<{ status: "duplicate" } | { status: "roleConflict" } | { status: "updated" }> {
    if (input.isDuplicateName(input.bookingType.cName, input.bookingType.cID)) {
        return {status: "duplicate"};
    }

    // A Buy/Sell/Dividend role must stay unique per account - resolveTypeIdByRole
    // (domain/logic.ts) only ever resolves the first match, so a second same-role
    // type would silently drop bookings recorded under it from portfolio/invest/
    // dividend totals. "other" is excluded since multiple custom types are fine.
    //
    // Read from the repository rather than `deps.records.bookingTypes.items`,
    // for the same reason `updateAccountUsecase`'s `existingRoles` is: the store
    // holds only the **active** account's booking types, so filtering it by
    // `cAccountNumberID` reads as account-agnostic while being correct only when
    // the account happens to be the active one. That was true for today's sole
    // caller and asserted nowhere. `findByAccount` is account-scoped by
    // construction.
    if (input.bookingType.cRole !== BOOKING_TYPE_ROLE.OTHER) {
        const sameAccountTypes = await deps.repositories.bookingTypes.findByAccount(
            input.bookingType.cAccountNumberID
        );
        const hasRoleConflict = sameAccountTypes.some(
            (bt) => bt.cID !== input.bookingType.cID && bt.cRole === input.bookingType.cRole
        );
        if (hasRoleConflict) {
            return {status: "roleConflict"};
        }
    }

    await deps.repositories.bookingTypes.save(input.bookingType);
    deps.records.bookingTypes.update(input.bookingType);
    deps.runtime.resetTeleport();
    // Changing a type's role changes which bookings count toward a stock's
    // holdings (domain/logic.ts resolves Buy/Sell/Dividend by the type's current
    // cRole, not a fixed id), which can reposition a stock across pages. Only
    // reached on the success path — the duplicate/roleConflict returns above
    // write nothing, so there is nothing to invalidate.
    deps.runtime.clearStocksPages();
    return {status: "updated"};
}
