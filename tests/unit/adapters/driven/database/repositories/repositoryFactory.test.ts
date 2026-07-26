/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createRepositoryFactory} from "@/adapters/driven/database/repositories/repositoryFactory";
import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

describe("RepositoryFactory", () => {
    let transactionManagerMock: TransactionManagerContract;

    beforeEach(() => {
        transactionManagerMock = {
            execute: vi.fn(),
            executeMultiple: vi.fn()
        } as unknown as TransactionManagerContract;
    });

    it("lazily creates and caches a repository instance per type", () => {
        const factory = createRepositoryFactory(transactionManagerMock);

        const first = factory.getRepository("accounts");
        const second = factory.getRepository("accounts");

        expect(first).toBe(second);
        expect(typeof first.findById).toBe("function");
    });

    it("creates distinct instances for distinct repository types", () => {
        const factory = createRepositoryFactory(transactionManagerMock);

        const accounts = factory.getRepository("accounts");
        const bookings = factory.getRepository("bookings");

        expect(accounts).not.toBe(bookings);
    });

    it("getAllRepositories() returns all four repository types, reusing cached instances", () => {
        const factory = createRepositoryFactory(transactionManagerMock);

        const direct = factory.getRepository("stocks");
        const all = factory.getAllRepositories();

        expect(Object.keys(all).sort()).toEqual(
            ["accounts", "bookingTypes", "bookings", "stocks"].sort()
        );
        expect(all.stocks).toBe(direct);
    });

    it("clearCache() forces a fresh instance on the next getRepository() call", () => {
        const factory = createRepositoryFactory(transactionManagerMock);

        const before = factory.getRepository("accounts");
        factory.clearCache();
        const after = factory.getRepository("accounts");

        expect(before).not.toBe(after);
    });

    it("throws for an unknown repository type", () => {
        const factory = createRepositoryFactory(transactionManagerMock);

        expect(() =>
            factory.getRepository("unknown" as unknown as Parameters<typeof factory.getRepository>[0])
        ).toThrow();
    });
});