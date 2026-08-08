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
    // Deliberately does NOT map `cISIN`/`cSymbol`.
    //
    // The `stocks_uk1`/`stocks_uk2` indexes those fields live on are, despite
    // the `uk` prefix, `{unique: false}` and NOT account-scoped (migrator.ts
    // `createStores`; `migrateStocksAccountScopedUniqueness` demoted them at
    // schema v27 and moved real uniqueness onto the composite `uk3`/`uk4`,
    // `[cAccountNumberID, cISIN]` / `[cAccountNumberID, cSymbol]`). Mapping
    // them here advertised a `findBy("cISIN", …)` / `deleteBy("cISIN", …)` that
    // would silently match — or delete — stocks belonging to EVERY account.
    //
    // Nothing called either (only findByAccount/deleteByAccount below are used),
    // so this removes a latent cross-account leak rather than changing behaviour.
    // `findBy`/`deleteBy` now throw NO_INDEX for these fields, which is the
    // honest answer: there is no account-scoped single-field index to serve them.
    // A composite lookup would need the `uk3`/`uk4` key range, not this map.
    const base = createBaseRepository<StockDb>(
        INDEXED_DB.STORE.STOCKS.NAME,
        transactionManager,
        new Map([
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
        //
        // `StockDb` declares both identifiers optional precisely so this can be
        // said in the type system; it used to need an `as unknown as StockDb`
        // double cast, which also meant every raw row read back was typed as
        // though the fields were always present.
        const toPersist: StockDb = {...validated};
        if (toPersist.cISIN?.trim() === "") {
            delete toPersist.cISIN;
        }
        if (toPersist.cSymbol?.trim() === "") {
            delete toPersist.cSymbol;
        }
        return base.save(toPersist, options);
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
     * Counts stocks for an account.
     *
     * Counts through the index rather than materializing every row via
     * `findByAccount(...).length` — see `baseRepository.countBy`.
     */
    async function countByAccount(accountId: number): Promise<number> {
        return base.countBy("cAccountNumberID", accountId);
    }

    return {
        ...base,
        save,
        findByAccount,
        deleteByAccount,
        countByAccount
    };
}