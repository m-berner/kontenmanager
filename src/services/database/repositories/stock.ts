/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/configs/database";
import type {QueryOptions, StockDb} from "@/types";
import {BaseRepository} from "./base";
import type {TransactionManager} from "../transaction/manager";

/**
 * Repository for stock operations
 */
export class StockRepository extends BaseRepository<StockDb> {
    constructor(transactionManager: TransactionManager) {
        super(
            INDEXED_DB.STORE.STOCKS.NAME,
            transactionManager,
            new Map([
                ["cISIN", `${INDEXED_DB.STORE.STOCKS.NAME}_uk1`],
                ["cSymbol", `${INDEXED_DB.STORE.STOCKS.NAME}_uk2`],
                ["cFadeOut", `${INDEXED_DB.STORE.STOCKS.NAME}_k1`],
                ["cFirstPage", `${INDEXED_DB.STORE.STOCKS.NAME}_k2`],
                ["cAccountNumberID", `${INDEXED_DB.STORE.STOCKS.NAME}_k3`]
            ])
        );
    }

    /**
     * Finds all stocks for an account
     */
    async findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<StockDb[]> {
        return this.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Deletes all stocks for an account
     */
    async deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts stocks for an account
     */
    async countByAccount(accountId: number): Promise<number> {
        const stocks = await this.findByAccount(accountId);
        return stocks.length;
    }
}
