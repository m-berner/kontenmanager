/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {toRecordsPort, toSettingsPort, type RecordsLike} from "@/app/usecases/portAdapters";
import {makeAccountDb, makeBookingDb, makeStockDb} from "@test/usecases";

describe("usecases/portAdapters", () => {
    describe("toSettingsPort", () => {
        it("reads through to the underlying activeAccountId", () => {
            const settings = {activeAccountId: 5};
            const port = toSettingsPort(settings);
            expect(port.activeAccountId).toBe(5);
        });

        it("writes through to the underlying activeAccountId", () => {
            const settings = {activeAccountId: 5};
            const port = toSettingsPort(settings);
            port.activeAccountId = 9;
            expect(settings.activeAccountId).toBe(9);
        });
    });

    describe("toRecordsPort", () => {
        function makeRecordsLike(): RecordsLike {
            return {
                accounts: {
                    items: [makeAccountDb({cID: 1})],
                    add: vi.fn(),
                    update: vi.fn(),
                    remove: vi.fn()
                },
                bookingTypes: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
                bookings: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
                stocks: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
                clean: vi.fn(),
                init: vi.fn().mockResolvedValue(undefined)
            };
        }

        it("exposes accounts.items as a live getter onto the source", () => {
            const records = makeRecordsLike();
            const port = toRecordsPort(records);

            expect(port.accounts.items).toEqual(records.accounts.items);

            records.accounts.items = [makeAccountDb({cID: 2})];
            expect(port.accounts.items).toEqual(records.accounts.items);
        });

        it("forwards accounts.add/update/remove to the source methods", () => {
            const records = makeRecordsLike();
            const port = toRecordsPort(records);
            const account = makeAccountDb({cID: 3});

            port.accounts.add(account);
            expect(records.accounts.add).toHaveBeenCalledWith(account);

            port.accounts.update(account);
            expect(records.accounts.update).toHaveBeenCalledWith(account);

            port.accounts.remove(3);
            expect(records.accounts.remove).toHaveBeenCalledWith(3);
        });

        it("forwards clean() and init() to the source", async () => {
            const records = makeRecordsLike();
            const port = toRecordsPort(records);

            port.clean(false);
            expect(records.clean).toHaveBeenCalledWith(false);

            const dbData = {accountsDB: [], bookingsDB: [], bookingTypesDB: [], stocksDB: []};
            const messages = {title: "T", message: "M"};
            await port.init(dbData, messages);
            expect(records.init).toHaveBeenCalledWith(dbData, messages);
        });

        it("exposes bookingTypes/bookings/stocks .items as live getters onto the source", () => {
            const records = makeRecordsLike();
            const port = toRecordsPort(records);

            expect(port.bookingTypes.items).toEqual(records.bookingTypes.items);
            expect(port.bookings.items).toEqual(records.bookings.items);
            expect(port.stocks.items).toEqual(records.stocks.items);

            records.bookingTypes.items = [{cID: 1, cName: "Buy", cAccountNumberID: 1}];
            records.bookings.items = [makeBookingDb({cID: 1})];
            records.stocks.items = [makeStockDb({cID: 1})];

            expect(port.bookingTypes.items).toEqual(records.bookingTypes.items);
            expect(port.bookings.items).toEqual(records.bookings.items);
            expect(port.stocks.items).toEqual(records.stocks.items);
        });
    });
});