/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {AccountDb} from "@/domain/types";
import {validateAccount} from "@/domain/validation/validators";

import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

import {createBaseRepository} from "./baseRepository";

/**
 * Creates an account repository instance.
 */
export function createAccountRepository(transactionManager: TransactionManagerContract) {
    const base = createBaseRepository<AccountDb>(
        INDEXED_DB.STORE.ACCOUNTS.NAME,
        transactionManager,
        new Map([["cIban", `${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`]])
    );

    async function save(data: AccountDb | Omit<AccountDb, "cID">, options = {}): Promise<number> {
        const validated = validateAccount(data);

        // Omit a blank IBAN rather than persisting `""`, mirroring
        // `stockRepository.save()`'s treatment of blank `cISIN`/`cSymbol`.
        // `accounts_uk1` is `unique: true` on `cIban` and — unlike the stocks
        // indexes — is **global**, not account-scoped (migrator.ts), so a stored
        // `""` collides with every other IBAN-less account across the whole
        // database. IndexedDB indexes an explicit empty string as a real value
        // while an absent key is excluded from the index entirely.
        //
        // `importHelpers.stripBlankAccountIban` already did this for the import
        // path, on the argument that the live path cannot produce a blank IBAN
        // because `AccountForm`'s `ibanRules` require a checksum-valid one. That
        // argument rests entirely on the form: `validateAccount` only *logs a
        // warning* for an invalid IBAN and returns the record anyway, so any
        // non-form caller reaching here with `cIban: ""` persisted it and the
        // second such account failed with a raw ConstraintError.
        const toPersist: AccountDb = {...validated};
        if (toPersist.cIban?.trim() === "") {
            delete toPersist.cIban;
        }

        return base.save(toPersist, options);
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