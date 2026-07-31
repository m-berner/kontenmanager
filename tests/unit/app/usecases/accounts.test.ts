/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
import type {RecordsDbData} from "@/domain/types";
import {addAccountUsecase, deleteActiveAccountUsecase, updateAccountUsecase} from "@/app/usecases/accounts";
import {
    createDatabaseAccountsPortMock,
    createRecordsPortMock,
    createRepositoriesPortMock,
    createRuntimePortMock,
    createSetStorageMock,
    createSettingsPortMock
} from "@test/usecases";

describe("usecases/accounts", () => {
    it("addAccountUsecase adds account and default booking types when withDepot=true", async () => {
        const accountsSave = vi.fn().mockResolvedValue(10);
        const bookingTypesSave = vi.fn()
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(101)
            .mockResolvedValueOnce(102);

        const databaseAdapter = createDatabaseAccountsPortMock();
        const records = createRecordsPortMock();
        const settings = createSettingsPortMock(-1);
        const runtime = createRuntimePortMock();
        const setStorage = createSetStorageMock();

        const res = await addAccountUsecase(
            {
                databaseAdapter,
                repositories: createRepositoriesPortMock({
                    accounts: {save: accountsSave},
                    bookingTypes: {save: bookingTypesSave}
                }),
                records,
                settings,
                runtime,
                setStorage
            },
            {
                accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true},
                withDepot: true,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"},
                initMessages: {title: "IT", message: "IM"}
            }
        );

        expect(accountsSave).toHaveBeenCalledTimes(1);
        expect(bookingTypesSave).toHaveBeenCalledTimes(3);
        expect(records.accounts.add).toHaveBeenCalledWith(expect.objectContaining({cID: 10}));
        expect(records.bookingTypes.add).toHaveBeenCalledTimes(3);
        expect(settings.activeAccountId).toBe(10);
        expect(setStorage).toHaveBeenCalledTimes(1);
        expect(runtime.resetTeleport).toHaveBeenCalledTimes(1);
        expect(res).toEqual({accountId: 10, createdBookingTypes: 3});
        // Every other path that populates the stocks store (initializeRecords)
        // seeds this sentinel "no stock" row for BookingForm.vue's stock
        // picker; addAccountUsecase's success path must too, since it doesn't
        // go through initializeRecords.
        expect(records.stocks.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 0, cISIN: "XX0000000000", cAccountNumberID: 10})
        );
    });

    it("addAccountUsecase cleans stale per-account records before adding the new booking types", async () => {
        const accountsSave = vi.fn().mockResolvedValue(10);
        const bookingTypesSave = vi.fn()
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(101)
            .mockResolvedValueOnce(102);

        const databaseAdapter = createDatabaseAccountsPortMock();
        const records = createRecordsPortMock();

        await addAccountUsecase(
            {
                databaseAdapter,
                repositories: createRepositoriesPortMock({
                    accounts: {save: accountsSave},
                    bookingTypes: {save: bookingTypesSave}
                }),
                records,
                settings: createSettingsPortMock(-1),
                runtime: createRuntimePortMock(),
                setStorage: createSetStorageMock()
            },
            {
                accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true},
                withDepot: true,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"},
                initMessages: {title: "IT", message: "IM"}
            }
        );

        // clean(false) must run before the new account's booking types are added,
        // otherwise it wipes them back out immediately (records.clean clears the
        // real Pinia store's items array even though this mock is a no-op).
        const cleanCallOrder = (records.clean as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
        const firstAddCallOrder = (records.bookingTypes.add as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
        expect(cleanCallOrder).toBeLessThan(firstAddCallOrder);
    });

    it("addAccountUsecase reverts activeAccountId when persisting it fails", async () => {
        const accountsSave = vi.fn().mockResolvedValue(10);
        const databaseAdapter = createDatabaseAccountsPortMock();
        const settings = createSettingsPortMock(-1);
        const setStorage = vi.fn().mockRejectedValue(new Error("storage unavailable"));

        await expect(
            addAccountUsecase(
                {
                    databaseAdapter,
                    repositories: createRepositoriesPortMock({
                        accounts: {save: accountsSave},
                        bookingTypes: {save: vi.fn()}
                    }),
                    records: createRecordsPortMock(),
                    settings,
                    runtime: createRuntimePortMock(),
                    setStorage
                },
                {
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false},
                    withDepot: false,
                    bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"},
                    initMessages: {title: "IT", message: "IM"}
                }
            )
        ).rejects.toThrow("storage unavailable");

        expect(settings.activeAccountId).toBe(-1);
    });

    it("addAccountUsecase restores the previous account's in-memory records when persisting the new active id fails", async () => {
        const accountsSave = vi.fn().mockResolvedValue(10);
        const previousAccountRecords: RecordsDbData = {
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        };
        const getAccountRecords = vi.fn().mockResolvedValue(previousAccountRecords);
        const databaseAdapter = createDatabaseAccountsPortMock({getAccountRecords});
        // The previously active account (id 1) is what setActiveAccountIdPersisted
        // reverts settings.activeAccountId back to after the storage write fails.
        const settings = createSettingsPortMock(1);
        const records = createRecordsPortMock();
        const setStorage = vi.fn().mockRejectedValue(new Error("storage unavailable"));

        await expect(
            addAccountUsecase(
                {
                    databaseAdapter,
                    repositories: createRepositoriesPortMock({
                        accounts: {save: accountsSave},
                        bookingTypes: {save: vi.fn()}
                    }),
                    records,
                    settings,
                    runtime: createRuntimePortMock(),
                    setStorage
                },
                {
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false},
                    withDepot: false,
                    bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"},
                    initMessages: {title: "IT", message: "IM"}
                }
            )
        ).rejects.toThrow("storage unavailable");

        expect(settings.activeAccountId).toBe(1);
        expect(getAccountRecords).toHaveBeenCalledWith(1);
        expect(records.init).toHaveBeenCalledWith(previousAccountRecords, {title: "IT", message: "IM"});
    });

    it("addAccountUsecase throws if repository save returns INVALID_ID", async () => {
        const accountsSave = vi.fn().mockResolvedValue(INDEXED_DB.INVALID_ID);
        const databaseAdapter = createDatabaseAccountsPortMock();

        await expect(
            addAccountUsecase(
                {
                    databaseAdapter,
                    repositories: createRepositoriesPortMock({
                        accounts: {save: accountsSave},
                        bookingTypes: {save: vi.fn()}
                    }),
                    records: createRecordsPortMock(),
                    settings: createSettingsPortMock(-1),
                    runtime: createRuntimePortMock(),
                    setStorage: createSetStorageMock()
                },
                {
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false},
                    withDepot: false,
                    bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"},
                    initMessages: {title: "IT", message: "IM"}
                }
            )
        ).rejects.toThrow();
    });

    it("updateAccountUsecase updates records, saves and resets teleport", async () => {
        const save = vi.fn().mockResolvedValue(1);
        const records = createRecordsPortMock();
        const runtime = createRuntimePortMock();

        await updateAccountUsecase(
            {repositories: createRepositoriesPortMock({accounts: {save}}), records, runtime},
            {account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false}}
        );

        expect(records.accounts.update).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
    });

    it("deleteActiveAccountUsecase deletes active account and switches to next", async () => {
        const databaseAdapter = createDatabaseAccountsPortMock({
            deleteAccountRecords: vi.fn().mockResolvedValue(undefined),
            getAccountRecords: vi.fn().mockResolvedValue({
                accountsDB: [],
                bookingsDB: [],
                bookingTypesDB: [],
                stocksDB: []
            })
        });
        const records = createRecordsPortMock({accountIds: [2]});
        const settings = createSettingsPortMock(1);
        const runtime = createRuntimePortMock();
        const setStorage = createSetStorageMock();

        const res = await deleteActiveAccountUsecase(
            {databaseAdapter, records, settings, runtime, setStorage},
            {
                initMessages: {title: "IT", message: "IM"}
            }
        );

        expect(databaseAdapter.deleteAccountRecords).toHaveBeenCalledWith(1);
        expect(records.accounts.remove).toHaveBeenCalledWith(1);
        expect(settings.activeAccountId).toBe(2);
        expect(setStorage).toHaveBeenCalled();
        expect(records.init).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
        expect(res).toEqual({newActiveAccountId: 2});
    });
});
