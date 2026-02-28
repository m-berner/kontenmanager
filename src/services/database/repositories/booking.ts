/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/configs/database";
import type {BookingDb, QueryOptions} from "@/types";
import {BaseRepository} from "./base";
import type {TransactionManager} from "../transaction/manager";

/**
 * Repository for booking operations
 */
export class BookingRepository extends BaseRepository<BookingDb> {
    constructor(transactionManager: TransactionManager) {
        super(
            INDEXED_DB.STORE.BOOKINGS.NAME,
            transactionManager,
            new Map([
                ["cBookDate", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`],
                ["cBookingTypeID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`],
                ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`],
                ["cStockID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`]
            ])
        );
    }

    /**
     * Finds all bookings for an account
     */
    async findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return this.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Finds bookings by date
     */
    async findByDate(
        date: string,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return this.findBy("cBookDate", date, options);
    }

    /**
     * Finds bookings by booking type
     */
    async findByBookingType(
        bookingTypeId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return this.findBy("cBookingTypeID", bookingTypeId, options);
    }

    /**
     * Finds bookings by stock
     */
    async findByStock(
        stockId: number,
        options: QueryOptions = {}
    ): Promise<BookingDb[]> {
        return this.findBy("cStockID", stockId, options);
    }

    /**
     * Deletes all bookings for an account
     */
    async deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts bookings for an account
     */
    async countByAccount(accountId: number): Promise<number> {
        const bookings = await this.findByAccount(accountId);
        return bookings.length;
    }
}
