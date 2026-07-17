/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {initRecordsUsecase} from "@/app/usecases/records/init";
import * as DomainLogic from "@/domain/logic";
import type {RecordsDbData} from "@/domain/types";

describe("usecases/records/init", () => {
    it("delegates to DomainLogic.initializeRecords with the same arguments", async () => {
        const spy = vi.spyOn(DomainLogic, "initializeRecords").mockResolvedValue(undefined);

        const storesDB: RecordsDbData = {
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        };
        const stores = {
            accounts: {} as never,
            bookings: {} as never,
            bookingTypes: {} as never,
            stocks: {} as never,
            settings: {} as never
        };
        const messages = {title: "T", message: "M"};

        await initRecordsUsecase(storesDB, stores, messages, false);

        expect(spy).toHaveBeenCalledWith(storesDB, stores, messages, false);
        spy.mockRestore();
    });

    it("defaults removeAccounts to true when not provided", async () => {
        const spy = vi.spyOn(DomainLogic, "initializeRecords").mockResolvedValue(undefined);

        const storesDB: RecordsDbData = {
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        };
        const stores = {
            accounts: {} as never,
            bookings: {} as never,
            bookingTypes: {} as never,
            stocks: {} as never,
            settings: {} as never
        };

        await initRecordsUsecase(storesDB, stores, {});

        expect(spy).toHaveBeenCalledWith(storesDB, stores, {}, true);
        spy.mockRestore();
    });
});