/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {setActiveAccountIdPersisted} from "@/app/usecases/portAdapters";
import type {
    DatabaseAccountsPort,
    PersistDeps,
    RecordsPort,
    RepositoriesPort,
    RuntimePort,
    SettingsPort,
    TxOptions
} from "@/app/usecases/ports";

import type {BookingTypeRoleType} from "@/domain/constants";
import {BOOKING_TYPE_ROLE, ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import {createPlaceholderStock} from "@/domain/logic";
import type {AccountDb, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";
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

export type UpdateAccountUsecaseDeps = PersistDeps & {
    databaseAdapter: DatabaseAccountsPort;
};

type DefaultBookingType = {
    cID: number;
    cName: string;
    cAccountNumberID: number;
    cRole: BookingTypeRoleType;
};

/**
 * Creates whichever of an account's default Buy/Sell/Dividend-role booking
 * types don't already exist. Shared by addAccountUsecase (new depot account —
 * existingRoles is always empty) and updateAccountUsecase (an existing account
 * whose withDepot flips from false to true). So both paths stamp the same
 * explicit cRole — relying on auto-increment order for role is what caused the
 * original bug this field fixes. Skipping already-present roles makes this
 * idempotent: toggling withDepot off and back on repeatedly (updateAccountUsecase
 * doesn't delete anything on the off transition) must not create duplicate
 * same-role types, since resolveTypeIdByRole (domain/logic.ts) only ever
 * resolves the first match and would silently drop bookings recorded under
 * any later duplicate.
 */
async function createDefaultBookingTypes(
    repositories: RepositoriesPort,
    accountId: number,
    labels: { buy: string; sell: string; dividend: string },
    existingRoles: Set<BookingTypeRoleType>,
    options?: TxOptions
): Promise<DefaultBookingType[]> {
    const defaults = [
        {
            cName: normalizeBookingTypeName(labels.buy),
            cAccountNumberID: accountId,
            cRole: BOOKING_TYPE_ROLE.BUY
        },
        {
            cName: normalizeBookingTypeName(labels.sell),
            cAccountNumberID: accountId,
            cRole: BOOKING_TYPE_ROLE.SELL
        },
        {
            cName: normalizeBookingTypeName(labels.dividend),
            cAccountNumberID: accountId,
            cRole: BOOKING_TYPE_ROLE.DIVIDEND
        }
    ].filter((bt) => !existingRoles.has(bt.cRole));

    const createdTypes: DefaultBookingType[] = [];
    for (const bt of defaults) {
        const id = await repositories.bookingTypes.save(bt, options);
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
    return createdTypes;
}

export async function addAccountUsecase(
    deps: AddAccountUsecaseDeps,
    input: {
        accountData: Omit<AccountDb, "cID">;
        withDepot: boolean;
        bookingTypeLabels: { buy: string; sell: string; dividend: string };
        initMessages: { title: string; message: string };
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

            const createdTypes: DefaultBookingType[] = input.withDepot
                ? await createDefaultBookingTypes(
                    deps.repositories,
                    accountId,
                    input.bookingTypeLabels,
                    new Set(),
                    {tx}
                )
                : [];

            return {accountId, createdTypes};
        }
    );

    deps.records.accounts.add({...input.accountData, cID: result.accountId});

    // Clear stale bookings/bookingTypes/stocks left over from the previously
    // active account before populating the new account's own booking types.
    deps.records.clean(false);
    for (const bt of result.createdTypes) deps.records.bookingTypes.add(bt);
    // Every other path that populates the stocks store (initializeRecords,
    // used by account switch/delete/import/app boot) also seeds this
    // sentinel "no stock" row that BookingForm.vue's stock picker relies on
    // for a blank option — without it. A booking added right after creating
    // this account (before the next switch/reload re-seeds it) would have no
    // blank entry in that dropdown.
    //
    // `prepend: true` matches initializeRecords, the only other seeder, so the
    // sentinel occupies the same position on both paths. It is indistinguishable
    // today (records.clean(false) above just emptied the store. So this is the
    // only row), but the two call sites must not silently disagree — and until
    // RecordsPort declared the flag, passing it here would have been dropped
    // without a type error.
    deps.records.stocks.add(createPlaceholderStock(result.accountId), true);

    try {
        await setActiveAccountIdPersisted(deps, result.accountId);
    } catch (err) {
        // The account and its default booking types are already committed
        // to IndexedDB and the in-memory store at this point; undo both so
        // a retry after this failure can't create a duplicate account.
        deps.records.accounts.remove(result.accountId);
        deps.records.clean(false);
        try {
            await deps.databaseAdapter.deleteAccountRecords(result.accountId);
        } catch (cleanupErr) {
            // Preserve the original persistence failure as the thrown error;
            // a failure here only means a retry may see a stale DB record.
            log("USECASES accounts: rollback cleanup failed after setActiveAccountIdPersisted failure", cleanupErr);
        }
        // setActiveAccountIdPersisted already reverted settings.activeAccountId
        // to the previously active account, but that account's bookings/
        // bookingTypes/stocks were already wiped by records.clean(false) above
        // (in anticipation of the switch succeeding) and never repopulated;
        // restore them from IndexedDB, which was never touched for that account.
        const previousAccountId = deps.settings.activeAccountId;
        if (previousAccountId !== INDEXED_DB.INVALID_ID) {
            const storesDB = await deps.databaseAdapter.getAccountRecords(previousAccountId);
            await deps.records.init(storesDB, input.initMessages);
        }
        throw err;
    }

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

    // INDEXED_DB.INVALID_ID, not a bare -1: it is the named "no active account"
    // sentinel and is what every other call site in this layer compares against
    // (import.ts's activeId fallback, addAccountUsecases rollback below).
    const newActiveAccountId = deps.records.accounts.items.length === 0
        ? INDEXED_DB.INVALID_ID
        : deps.records.accounts.items[0].cID;

    // accountToDelete is already gone from IndexedDB, so if persisting the new
    // id fails, setActiveAccountIdPersisted would revert settings.activeAccountId
    // back to a now-nonexistent account. Force it forward regardless, run the
    // same in-memory cleanup either way, then surface the persistence failure.
    let persistError: unknown;
    try {
        await setActiveAccountIdPersisted(deps, newActiveAccountId);
    } catch (err) {
        deps.settings.activeAccountId = newActiveAccountId;
        persistError = err;
    }

    if (newActiveAccountId === INDEXED_DB.INVALID_ID) {
        deps.records.clean(false);
    } else {
        const storesDB = await deps.databaseAdapter.getAccountRecords(newActiveAccountId);
        await deps.records.init(storesDB, input.initMessages);
    }

    deps.runtime.resetTeleport();
    if (persistError !== undefined) throw persistError;
    return {newActiveAccountId};
}

export async function updateAccountUsecase(
    deps: UpdateAccountUsecaseDeps,
    input: {
        account: AccountDb;
        previousWithDepot: boolean;
        bookingTypeLabels: { buy: string; sell: string; dividend: string };
    }
): Promise<void> {
    // withDepot flipping false -> true needs the same default Buy/Sell/Dividend
    // types addAccountUsecase creates for a brand-new depot account. Otherwise,
    // the account claims to be depot-enabled (Company nav appears) but has no
    // role-classified booking type a stock-related booking could ever resolve to.
    // existingRoles makes this idempotent: toggling withDepot off and back on
    // repeatedly must fill in only whatever roles are actually missing, not
    // create duplicates of roles the account already has.
    // Both writes share one transaction (matching addAccountUsecase) so a
    // mid-loop booking-type save failure can't leave the account persisted as
    // depot-enabled with a partial, permanently-stuck-or-duplicable role set.
    const createdTypes = await deps.databaseAdapter.transactionManager.execute(
        [INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKING_TYPES.NAME],
        "readwrite",
        async (tx: IDBTransaction) => {
            await deps.repositories.accounts.save(input.account, {tx});

            if (!input.account.cWithDepot || input.previousWithDepot) {
                return [];
            }

            // Read from the repository, not from `deps.records.bookingTypes`.
            // The store holds only the **active** account's booking types — the
            // contract `getAccountRecords` and `buildModernImportPlan` both
            // follow — so filtering it by `cAccountNumberID` yields an empty set
            // for any other account, and `createDefaultBookingTypes` would then
            // create a *second* Buy/Sell/Dividend set for an account that
            // already has them. That is the precise failure this guard exists to
            // prevent: `resolveTypeIdByRole` resolves only the first match per
            // role, so every booking recorded under a later duplicate silently
            // disappears from the portfolio, invest and dividend calculations.
            //
            // It happened to be correct only because the sole caller
            // (`UpdateAccount.vue`) can edit nothing but the active account —
            // an invariant this function never asserted and `useMenu`'s unwired
            // `updateAccount` handler would break. The repository read is
            // account-scoped by construction, and runs on the same `tx` so it
            // sees a consistent view.
            const existingRoles = new Set(
                (await deps.repositories.bookingTypes.findByAccount(input.account.cID, {tx}))
                    .map((bt) => bt.cRole)
            );
            return createDefaultBookingTypes(
                deps.repositories,
                input.account.cID,
                input.bookingTypeLabels,
                existingRoles,
                {tx}
            );
        }
    );

    deps.records.accounts.update(input.account);
    for (const bt of createdTypes) deps.records.bookingTypes.add(bt);

    deps.runtime.resetTeleport();
}
