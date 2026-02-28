/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/configs/database";
import type {AccountDb} from "@/types";
import {BaseRepository} from "./base";
import type {TransactionManager} from "../transaction/manager";

/**
 * Repository for account operations
 */
export class AccountRepository extends BaseRepository<AccountDb> {
    constructor(transactionManager: TransactionManager) {
        super(
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            transactionManager,
            new Map([["cIban", `${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`]])
        );
    }

    /**
     * Finds an account by IBAN
     */
    async findByIBAN(iban: string): Promise<AccountDb | null> {
        const accounts = await this.findBy("cIban", iban);
        return accounts[0] || null;
    }

    /**
     * Checks if an IBAN exists
     */
    async ibanExists(iban: string): Promise<boolean> {
        const account = await this.findByIBAN(iban);
        return !!account;
    }
}
