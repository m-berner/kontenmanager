/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {validateAccount} from "@/domains/validation/validators";
import {INDEXED_DB} from "@/domains/configs/database";
import type {AccountDb} from "@/types";
import {createBaseRepository} from "./base";

/**
 * Creates an account repository instance.
 */
export function createAccountRepository(transactionManager: any) {
    const base = createBaseRepository<AccountDb>(
        INDEXED_DB.STORE.ACCOUNTS.NAME,
        transactionManager,
        new Map([["cIban", `${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`]])
    );

    async function save(data: AccountDb | Omit<AccountDb, "cID">, options = {}): Promise<number> {
        return base.save(validateAccount(data as any), options);
    }

    /**
     * Finds an account by IBAN
     */
    async function findByIBAN(iban: string): Promise<AccountDb | null> {
        const accounts = await base.findBy("cIban", iban);
        return accounts[0] || null;
    }

    /**
     * Checks if an IBAN exists
     */
    async function ibanExists(iban: string): Promise<boolean> {
        const account = await findByIBAN(iban);
        return !!account;
    }

    return {
        ...base,
        save,
        findByIBAN,
        ibanExists
    };
}

export const AccountRepository = {
    create: createAccountRepository
};

