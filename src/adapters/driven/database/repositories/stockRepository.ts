/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {QueryOptions, StockDb} from "@/domain/types";
import {validateStock} from "@/domain/validation/validators";

import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

import {createBaseRepository} from "./baseRepository";

/**
 * Creates a stock repository instance.
 */
export function createStockRepository(transactionManager: TransactionManagerContract) {
    const base = createBaseRepository<StockDb>(
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


    async function save(data: StockDb | Omit<StockDb, "cID">, options = {}): Promise<number> {
        // Validate first to apply domain normalizations
        const validated = validateStock(data);
        // Important: Avoid unique index collisions on blank identifiers.
        // IndexedDB will index empty strings. With unique composite indexes
        // (accountId + ISIN) and (accountId + SYMBOL), multiple stocks with blank
        // identifiers for the same account would violate uniqueness on insert.
        // By omitting blank fields, no index entry is created for them.
        const toPersist: Record<string, unknown> = { ...validated };
        if (typeof toPersist.cISIN === "string" && (toPersist.cISIN as string).trim() === "") {
            delete toPersist.cISIN;
        }
        if (typeof toPersist.cSymbol === "string" && (toPersist.cSymbol as string).trim() === "") {
            delete toPersist.cSymbol;
        }
        return base.save(toPersist as unknown as StockDb, options);
    }

    /**
     * Finds all stocks for an account
     */
    async function findByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<StockDb[]> {
        return base.findBy("cAccountNumberID", accountId, options);
    }

    /**
     * Deletes all stocks for an account
     */
    async function deleteByAccount(
        accountId: number,
        options: QueryOptions = {}
    ): Promise<void> {
        return base.deleteBy("cAccountNumberID", accountId, options);
    }

    /**
     * Counts stocks for an account
     */
    async function countByAccount(accountId: number): Promise<number> {
        const stocks = await findByAccount(accountId);
        return stocks.length;
    }

    return {
        ...base,
        save,
        findByAccount,
        deleteByAccount,
        countByAccount
    };
}

export const StockRepository = {
    create: createStockRepository
};