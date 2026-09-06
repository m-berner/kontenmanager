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
                accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
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
        // picker; addAccountUsecase success path must too, since it doesn't
        // go through initializeRecords.
        //
        // `true` is the prepend flag, asserted explicitly so the two seeders
        // cannot drift: initializeRecords uses `stocks.add(placeholder, true)`,
        // and this call site silently dropped the argument until RecordsPort
        // declared it (the port's `add` omitted the optional parameter, so
        // passing it was a no-op TypeScript did not flag).
        expect(records.stocks.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 0, cISIN: "XX0000000000", cAccountNumberID: 10}),
            true
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
                accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
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
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false, cCurrency: "EUR"},
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
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false, cCurrency: "EUR"},
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
                    accountData: {cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false, cCurrency: "EUR"},
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
        const databaseAdapter = createDatabaseAccountsPortMock();

        await updateAccountUsecase(
            {
                databaseAdapter,
                repositories: createRepositoriesPortMock({accounts: {save}}),
                records,
                runtime
            },
            {
                account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false, cCurrency: "EUR"},
                previousWithDepot: false,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
            }
        );

        expect(records.accounts.update).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
        expect(runtime.resetTeleport).toHaveBeenCalled();
    });

    it("updateAccountUsecase does not create booking types when withDepot stays false or true", async () => {
        const bookingTypesSave = vi.fn();
        const records = createRecordsPortMock();

        await updateAccountUsecase(
            {
                databaseAdapter: createDatabaseAccountsPortMock(),
                repositories: createRepositoriesPortMock({
                    accounts: {save: vi.fn().mockResolvedValue(1)},
                    bookingTypes: {save: bookingTypesSave}
                }),
                records,
                runtime: createRuntimePortMock()
            },
            {
                account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
                previousWithDepot: true,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
            }
        );

        expect(bookingTypesSave).not.toHaveBeenCalled();
        expect(records.bookingTypes.add).not.toHaveBeenCalled();
    });

    it("updateAccountUsecase creates default Buy/Sell/Dividend booking types when withDepot flips false to true", async () => {
        const bookingTypesSave = vi.fn()
            .mockResolvedValueOnce(200)
            .mockResolvedValueOnce(201)
            .mockResolvedValueOnce(202);
        const records = createRecordsPortMock();

        await updateAccountUsecase(
            {
                databaseAdapter: createDatabaseAccountsPortMock(),
                repositories: createRepositoriesPortMock({
                    accounts: {save: vi.fn().mockResolvedValue(1)},
                    bookingTypes: {save: bookingTypesSave}
                }),
                records,
                runtime: createRuntimePortMock()
            },
            {
                account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
                previousWithDepot: false,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
            }
        );

        expect(bookingTypesSave).toHaveBeenCalledTimes(3);
        expect(records.bookingTypes.add).toHaveBeenCalledTimes(3);
        expect(records.bookingTypes.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 200, cRole: "buy", cAccountNumberID: 1})
        );
        expect(records.bookingTypes.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 201, cRole: "sell", cAccountNumberID: 1})
        );
        expect(records.bookingTypes.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 202, cRole: "dividend", cAccountNumberID: 1})
        );
    });

    it("updateAccountUsecase only creates roles the account doesn't already have (idempotent re-toggle)", async () => {
        // Simulates withDepot being toggled off then back on a second time: the
        // account already has buy/sell types (e.g. from a prior toggle) but is
        // missing dividend - only the missing role should be created, not a
        // duplicate buy/sell.
        //
        // The existing roles are seeded on the REPOSITORY, not on the records
        // store. `records.bookingTypes.items` holds only the active account's
        // types, so deriving `existingRoles` from it was correct purely because
        // the sole caller can only edit the active account — an invariant the
        // usecase never asserted. `findByAccount` is account-scoped by
        // construction.
        const bookingTypesSave = vi.fn().mockResolvedValueOnce(303);
        const records = createRecordsPortMock();

        await updateAccountUsecase(
            {
                databaseAdapter: createDatabaseAccountsPortMock(),
                repositories: createRepositoriesPortMock({
                    accounts: {save: vi.fn().mockResolvedValue(1)},
                    bookingTypes: {
                        save: bookingTypesSave,
                        findByAccount: vi.fn().mockResolvedValue([
                            {cID: 200, cAccountNumberID: 1, cRole: "buy", cName: "Buy"},
                            {cID: 201, cAccountNumberID: 1, cRole: "sell", cName: "Sell"}
                        ])
                    }
                }),
                records,
                runtime: createRuntimePortMock()
            },
            {
                account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
                previousWithDepot: false,
                bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
            }
        );

        expect(bookingTypesSave).toHaveBeenCalledTimes(1);
        expect(records.bookingTypes.add).toHaveBeenCalledTimes(1);
        expect(records.bookingTypes.add).toHaveBeenCalledWith(
            expect.objectContaining({cID: 303, cRole: "dividend", cAccountNumberID: 1})
        );
    });

    it("updateAccountUsecase rolls back the whole transaction if a default booking type fails mid-loop, leaving records untouched", async () => {
        const bookingTypesSave = vi.fn()
            .mockResolvedValueOnce(200) // Buy succeeds
            .mockRejectedValueOnce(new Error("disk full")); // Sell fails
        const records = createRecordsPortMock();

        await expect(
            updateAccountUsecase(
                {
                    databaseAdapter: createDatabaseAccountsPortMock(),
                    repositories: createRepositoriesPortMock({
                        accounts: {save: vi.fn().mockResolvedValue(1)},
                        bookingTypes: {save: bookingTypesSave}
                    }),
                    records,
                    runtime: createRuntimePortMock()
                },
                {
                    account: {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: true, cCurrency: "EUR"},
                    previousWithDepot: false,
                    bookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div"}
                }
            )
        ).rejects.toThrow("disk full");

        // Both records write happen only after the whole transaction resolves,
        // so a mid-loop failure must leave the in-memory store untouched rather
        // than desynced from a partially-committed DB state.
        expect(records.accounts.update).not.toHaveBeenCalled();
        expect(records.bookingTypes.add).not.toHaveBeenCalled();
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
