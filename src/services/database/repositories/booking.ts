/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {validateBooking} from "@/domains/validation/validators";
import {INDEXED_DB} from "@/constants";
import type {BookingDb, QueryOptions} from "@/types";
import type {TransactionManagerContract} from "@/services/database/transaction/manager";
import {createBaseRepository} from "./base";

/**
 * Creates a booking repository instance.
 */
export function createBookingRepository(transactionManager: TransactionManagerContract) {
    const base = createBaseRepository<BookingDb>(
        INDEXED_DB.STORE.BOOKINGS.NAME,
        transactionManager,
        new Map([
            ["cBookDate", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`],
            ["cBookingTypeID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`],
            ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`],
            ["cStockID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`]
        ])
    );

    async function save(data: BookingDb | Omit<BookingDb, "cID">, options = {}): Promise<number> {
        return base.save(validateBooking(data), options);
    }

    async function findAll(options: QueryOptions = {}): Promise<BookingDb[]> {
        const records = await base.findAll(options);
        return records.map((rec) => validateBooking(rec));
    }

    /**
     * Finds all bookings for an account
     */
    async function findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return base.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Finds bookings by date
     */
    async function findByDate(
        date: string,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return base.findBy("cBookDate", date, options);
    }

    /**
     * Finds bookings by booking type
     */
    async function findByBookingType(
        bookingTypeId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return base.findBy("cBookingTypeID", bookingTypeId, options);
    }

    /**
     * Finds bookings by stock
     */
    async function findByStock(
        stockId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return base.findBy("cStockID", stockId, options);
    }

    /**
     * Deletes all bookings for an account
     */
    async function deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return base.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts bookings for an account
     */
    async function countByAccount(accountId: number): Promise<number> {
        const bookings = await findByAccount(accountId);
        return bookings.length;
    }

    return {
        ...base,
        save,
        findAll,
        findByAccount,
        findByDate,
        findByBookingType,
        findByStock,
        deleteByAccount,
        countByAccount
    };
}

export const BookingRepository = {
    create: createBookingRepository
};
