/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {INDEXED_DB} from "@/domain/constants";
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

        const databaseService = createDatabaseAccountsPortMock();
        const records = createRecordsPortMock();
        const settings = createSettingsPortMock(-1);
        const runtime = createRuntimePortMock();
        const setStorage = createSetStorageMock();

        const res = await addAccountUsecase(
            {
                databaseService,
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
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
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
    });

    it("addAccountUsecase throws if repository save returns INVALID_ID", async () => {
        const accountsSave = vi.fn().mockResolvedValue(INDEXED_DB.INVALID_ID);
        const databaseService = createDatabaseAccountsPortMock();

        await expect(
            addAccountUsecase(
                {
                    databaseService,
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
                    bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
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
        const databaseService = createDatabaseAccountsPortMock({
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
            {databaseService, records, settings, runtime, setStorage},
            {
                initMessages: {title: "IT", message: "IM"}
            }
        );

        expect(databaseService.deleteAccountRecords).toHaveBeenCalledWith(1);
        expect(records.accounts.remove).toHaveBeenCalledWith(1);
        expect(settings.activeAccountId).toBe(2);
        expect(setStorage).toHaveBeenCalled();
        expect(records.init).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
        expect(res).toEqual({newActiveAccountId: 2});
    });
});
