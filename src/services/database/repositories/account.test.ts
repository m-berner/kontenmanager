/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {AccountRepository} from "./account";
import type {TransactionManager} from "../transaction/manager";
import {INDEXED_DB} from "@/configs/database";

describe("AccountRepository", () => {
    let repository: AccountRepository;
    let transactionManagerMock: any;
    let txMock: any;
    let storeMock: any;
    let indexMock: any;
    let requestMock: any;

    beforeEach(() => {
        requestMock = {
            onsuccess: null,
            onerror: null,
            result: null
        };

        indexMock = {
            getAll: vi.fn().mockReturnValue(requestMock)
        };

        storeMock = {
            get: vi.fn().mockReturnValue(requestMock),
            getAll: vi.fn().mockReturnValue(requestMock),
            add: vi.fn().mockReturnValue(requestMock),
            put: vi.fn().mockReturnValue(requestMock),
            delete: vi.fn().mockReturnValue(requestMock),
            index: vi.fn().mockReturnValue(indexMock)
        };

        txMock = {
            objectStore: vi.fn().mockReturnValue(storeMock)
        };

        transactionManagerMock = {
            execute: vi.fn().mockImplementation((_stores, _mode, operation) => {
                return operation(txMock);
            })
        };

        repository = new AccountRepository(transactionManagerMock as TransactionManager);
    });

    it("should find an account by ID", async () => {
        const account = {cID: 1, cSwift: "TEST", cIban: "DE123"};
        requestMock.result = account;

        const promise = repository.findById(1);
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(account);
        expect(txMock.objectStore).toHaveBeenCalledWith(INDEXED_DB.STORE.ACCOUNTS.NAME);
        expect(storeMock.get).toHaveBeenCalledWith(1);
    });

    it("should find an account by IBAN", async () => {
        const account = {cID: 1, cSwift: "TEST", cIban: "DE123"};
        requestMock.result = [account];

        const promise = repository.findByIBAN("DE123");
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toEqual(account);
        expect(storeMock.index).toHaveBeenCalledWith(`${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`);
        expect(indexMock.getAll).toHaveBeenCalledWith("DE123");
    });

    it("should return null if IBAN not found", async () => {
        requestMock.result = [];

        const promise = repository.findByIBAN("NONEXISTENT");
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toBeNull();
    });

    it("should check if IBAN exists", async () => {
        requestMock.result = [{cID: 1}];

        const promise = repository.ibanExists("DE123");
        requestMock.onsuccess();
        const result = await promise;

        expect(result).toBe(true);
    });

    it("should save a new account", async () => {
        const newAccount = {cSwift: "NEW", cIban: "DE456", cLogoUrl: "", cWithDepot: false};
        requestMock.result = 2;

        const promise = repository.save(newAccount as any);
        requestMock.onsuccess();
        const id = await promise;

        expect(id).toBe(2);
        expect(storeMock.add).toHaveBeenCalledWith(expect.not.objectContaining({cID: expect.anything()}));
    });

    it("should update an existing account", async () => {
        const existingAccount = {cID: 1, cSwift: "UPD", cIban: "DE123", cLogoUrl: "", cWithDepot: false};
        requestMock.result = 1;

        const promise = repository.save(existingAccount);
        requestMock.onsuccess();
        const id = await promise;

        expect(id).toBe(1);
        expect(storeMock.put).toHaveBeenCalledWith(existingAccount);
    });
});
