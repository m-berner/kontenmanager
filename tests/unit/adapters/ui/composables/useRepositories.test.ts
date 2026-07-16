/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";

const repositories = {
    accounts: {name: "accounts"},
    bookings: {name: "bookings"},
    bookingTypes: {name: "bookingTypes"},
    stocks: {name: "stocks"}
};

vi.mock("@/adapters/context", () => ({
    useAdapters: () => ({repositories})
}));

import {useRepositories} from "@/adapters/ui/composables/useRepositories";

describe("useRepositories", () => {
    it("exposes each repository under its typed accessor name", () => {
        const result = useRepositories();

        expect(result.accountsRepository).toBe(repositories.accounts);
        expect(result.bookingsRepository).toBe(repositories.bookings);
        expect(result.bookingTypesRepository).toBe(repositories.bookingTypes);
        expect(result.stocksRepository).toBe(repositories.stocks);
    });
});