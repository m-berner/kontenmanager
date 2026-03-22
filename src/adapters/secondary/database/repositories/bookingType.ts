/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {BookingTypeDb, QueryOptions} from "@/domain/types";
import {validateBookingType} from "@/domain/validation/validators";

import {createBaseRepository} from "./base";

import type {TransactionManagerContract} from "@/adapters/secondary/database/transaction/manager";

/**
 * Creates a booking type repository instance.
 */
export function createBookingTypeRepository(transactionManager: TransactionManagerContract) {
    const base = createBaseRepository<BookingTypeDb>(
        INDEXED_DB.STORE.BOOKING_TYPES.NAME,
        transactionManager,
        new Map([
            ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`]
        ])
    );

    async function save(data: BookingTypeDb | Omit<BookingTypeDb, "cID">, options = {}): Promise<number> {
        return base.save(validateBookingType(data), options);
    }

    /**
     * Finds all booking types for an account
     */
    async function findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<BookingTypeDb[]> {
        return base.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Deletes all booking types for an account
     */
    async function deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return base.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts booking types for an account
     */
    async function countByAccount(accountId: number): Promise<number> {
        const bookingTypes = await findByAccount(accountId);
        return bookingTypes.length;
    }

    return {
        ...base,
        save,
        findByAccount,
        deleteByAccount,
        countByAccount
    };
}

export const BookingTypeRepository = {
    create: createBookingTypeRepository
};

