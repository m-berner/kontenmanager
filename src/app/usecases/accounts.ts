/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    DatabaseAccountsPort,
    PersistDeps,
    RecordsPort,
    RepositoriesPort,
    RuntimePort,
    SettingsPort
} from "@/app/usecases/ports";

import {BROWSER_STORAGE, ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {AccountDb, StorageValueType} from "@/domain/types";
import {normalizeBookingTypeName} from "@/domain/validation/validators";

export type AddAccountUsecaseDeps = {
    databaseAdapter: DatabaseAccountsPort;
    repositories: RepositoriesPort;
    records: RecordsPort;
    settings: SettingsPort;
    runtime: RuntimePort;
    setStorage: (key: string, value: StorageValueType) => Promise<void>;
};

export type DeleteAccountUsecaseDeps = {
    databaseAdapter: DatabaseAccountsPort;
    records: RecordsPort;
    settings: SettingsPort;
    runtime: RuntimePort;
    setStorage: (key: string, value: StorageValueType) => Promise<void>;
};

export type UpdateAccountUsecaseDeps = PersistDeps;

export async function addAccountUsecase(
    deps: AddAccountUsecaseDeps,
    input: {
        accountData: Omit<AccountDb, "cID">;
        withDepot: boolean;
        bookingTypeLabels: { buy: string; sell: string; dividend: string };
    }
): Promise<{ accountId: number; createdBookingTypes: number }> {
    const result = await deps.databaseAdapter.transactionManager.execute(
        [INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKING_TYPES.NAME],
        "readwrite",
        async (tx: IDBTransaction) => {
            const accountId = await deps.repositories.accounts.save(input.accountData, {tx});
            if (accountId === INDEXED_DB.INVALID_ID) {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
                    ERROR_CATEGORY.DATABASE,
                    true,
                    {entity: "account"}
                );
            }

            const createdTypes: {
                cID: number;
                cName: string;
                cAccountNumberID: number;
            }[] = [];
            if (input.withDepot) {
                const defaults = [
                    {
                        cName: normalizeBookingTypeName(input.bookingTypeLabels.buy),
                        cAccountNumberID: accountId
                    },
                    {
                        cName: normalizeBookingTypeName(input.bookingTypeLabels.sell),
                        cAccountNumberID: accountId
                    },
                    {
                        cName: normalizeBookingTypeName(input.bookingTypeLabels.dividend),
                        cAccountNumberID: accountId
                    }
                ];

                for (const bt of defaults) {
                    const id = await deps.repositories.bookingTypes.save(bt, {tx});
                    if (id === INDEXED_DB.INVALID_ID) {
                        throw appError(
                            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
                            ERROR_CATEGORY.DATABASE,
                            true,
                            {entity: "bookingType"}
                        );
                    }
                    createdTypes.push({cID: id, ...bt});
                }
            }

            return {accountId, createdTypes};
        }
    );

    deps.records.accounts.add({...input.accountData, cID: result.accountId});
    for (const bt of result.createdTypes) deps.records.bookingTypes.add(bt);

    deps.settings.activeAccountId = result.accountId;
    await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, result.accountId);

    deps.records.clean(false);
    deps.runtime.resetTeleport();
    return {
        accountId: result.accountId,
        createdBookingTypes: result.createdTypes.length
    };
}

export async function deleteActiveAccountUsecase(
    deps: DeleteAccountUsecaseDeps,
    input: {
        initMessages: { title: string; message: string };
    }
): Promise<{ newActiveAccountId: number }> {
    const accountToDelete = deps.settings.activeAccountId;
    await deps.databaseAdapter.deleteAccountRecords(accountToDelete);
    deps.records.accounts.remove(accountToDelete);

    if (deps.records.accounts.items.length === 0) {
        deps.settings.activeAccountId = -1;
        await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, -1);
    } else {
        deps.settings.activeAccountId = deps.records.accounts.items[0].cID;
        await deps.setStorage(
            BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
            deps.settings.activeAccountId
        );

        const storesDB = await deps.databaseAdapter.getAccountRecords(
            deps.settings.activeAccountId
        );
        await deps.records.init(storesDB, input.initMessages);
    }

    deps.runtime.resetTeleport();
    return {newActiveAccountId: deps.settings.activeAccountId};
}

export async function updateAccountUsecase(
    deps: UpdateAccountUsecaseDeps,
    input: { account: AccountDb }
): Promise<void> {
    deps.records.accounts.update(input.account);
    await deps.repositories.accounts.save(input.account);
    deps.runtime.resetTeleport();
}
