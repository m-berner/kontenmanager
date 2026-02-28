/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/configs/database";
import type {BookingTypeDb, QueryOptions} from "@/types";
import {BaseRepository} from "./base";
import type {TransactionManager} from "../transaction/manager";

/**
 * Repository for booking type operations
 */
export class BookingTypeRepository extends BaseRepository<BookingTypeDb> {
    constructor(transactionManager: TransactionManager) {
        super(
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            transactionManager,
            new Map([
                ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`]
            ])
        );
    }

    /**
     * Finds all booking types for an account
     */
    async findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<BookingTypeDb[]> {
        return this.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Deletes all booking types for an account
     */
    async deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts booking types for an account
     */
    async countByAccount(accountId: number): Promise<number> {
        const bookingTypes = await this.findByAccount(accountId);
        return bookingTypes.length;
    }
}
