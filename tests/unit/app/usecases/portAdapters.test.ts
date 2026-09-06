/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {toRecordsPort, toSettingsPort, type RecordsLike} from "@/app/usecases/portAdapters";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

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

        it("exposes ´accounts.items´ as a live getter onto the source", () => {
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

            // The trailing `undefined` is the forwarded `prepend` flag — the
            // port passes it straight through rather than dropping it.
            port.accounts.add(account);
            expect(records.accounts.add).toHaveBeenCalledWith(account, undefined);

            port.accounts.update(account);
            expect(records.accounts.update).toHaveBeenCalledWith(account);

            port.accounts.remove(3);
            expect(records.accounts.remove).toHaveBeenCalledWith(3);
        });

        it("forwards the prepend flag on accounts/bookingTypes/stocks add, not just bookings", () => {
            // Regression test: RecordsPort declared `add` without the optional
            // `prepend` parameter for these three, so toRecordsPort silently
            // dropped the argument and TypeScript endorsed the loss — a caller
            // could pass `true` and be quietly ignored. Only `bookings` got it
            // right. addAccountUsecase's placeholder-stock seed is the call
            // site that depends on this.
            const records = makeRecordsLike();
            const port = toRecordsPort(records);

            port.accounts.add(makeAccountDb({cID: 3}), true);
            expect(records.accounts.add).toHaveBeenCalledWith(expect.anything(), true);

            port.bookingTypes.add(makeBookingTypeDb({cID: 4, cName: "Buy"}), true);
            expect(records.bookingTypes.add).toHaveBeenCalledWith(expect.anything(), true);

            port.stocks.add(makeStockDb({cID: 5}), true);
            expect(records.stocks.add).toHaveBeenCalledWith(expect.anything(), true);
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

            records.bookingTypes.items = [makeBookingTypeDb({cID: 1, cName: "Buy"})];
            records.bookings.items = [makeBookingDb({cID: 1})];
            records.stocks.items = [makeStockDb({cID: 1})];

            expect(port.bookingTypes.items).toEqual(records.bookingTypes.items);
            expect(port.bookings.items).toEqual(records.bookings.items);
            expect(port.stocks.items).toEqual(records.stocks.items);
        });

        // The repositories validate before writing to IndexedDB, but the usecases
        // used to hand the store their own *raw* input — so the DB held the
        // normalized record while the in-memory store held whatever the caller
        // passed, until the next reload. That is how a share count typed into a
        // Vuetify type="number" field (a string) reached the store as a string and
        // turned calculatePortfolioByStockId's `acc + entry.cCount` into string
        // concatenation. The port now normalizes with the same domain validators.
        describe("normalize records the same way the repositories do", () => {
            it("coerces a string cCount on ´bookings.add´ and ´bookings.update´", () => {
                const records = makeRecordsLike();
                const port = toRecordsPort(records);
                const raw = makeBookingDb({cID: 4, cCount: "10" as unknown as number});

                port.bookings.add(raw, true);
                const added = (records.bookings.add as unknown as {
                    mock: { calls: [{ cCount: number }, boolean][] }
                }).mock.calls[0];
                expect(added[0].cCount).toBe(10);
                expect(typeof added[0].cCount).toBe("number");
                // the prepend flag must still be forwarded
                expect(added[1]).toBe(true);

                port.bookings.update(raw);
                const updated = (records.bookings.update as unknown as {
                    mock: { calls: [{ cCount: number }][] }
                }).mock.calls[0];
                expect(updated[0].cCount).toBe(10);
                expect(typeof updated[0].cCount).toBe("number");
            });

            it("coerces string amounts on ´bookings.add´", () => {
                const records = makeRecordsLike();
                const port = toRecordsPort(records);

                port.bookings.add(makeBookingDb({
                    cID: 5,
                    cDebit: "1000" as unknown as number,
                    cCredit: "0" as unknown as number
                }));

                const added = (records.bookings.add as unknown as {
                    mock: { calls: [{ cDebit: number; cCredit: number }][] }
                }).mock.calls[0][0];
                expect(added.cDebit).toBe(1000);
                expect(added.cCredit).toBe(0);
            });

            it("normalizes iban/swift casing and whitespace on ´accounts.add´", () => {
                const records = makeRecordsLike();
                const port = toRecordsPort(records);

                port.accounts.add(makeAccountDb({
                    cID: 6,
                    cIban: " de89 3704 0044 0532 0130 00 ",
                    cSwift: " deutdeff "
                }));

                const added = (records.accounts.add as unknown as {
                    mock: { calls: [{ cIban: string; cSwift: string }][] }
                }).mock.calls[0][0];
                expect(added.cIban).toBe("DE89370400440532013000");
                expect(added.cSwift).toBe("DEUTDEFF");
            });

            it("drops RAM-only m* fields on ´stocks.add´ so the store re-seeds them", () => {
                const records = makeRecordsLike();
                const port = toRecordsPort(records);

                port.stocks.add({
                    ...makeStockDb({cID: 7}),
                    mValue: 123,
                    mPortfolio: 5
                } as unknown as ReturnType<typeof makeStockDb>);

                const added = (records.stocks.add as unknown as {
                    mock: { calls: [Record<string, unknown>][] }
                }).mock.calls[0][0];
                expect(added).not.toHaveProperty("mValue");
                expect(added).not.toHaveProperty("mPortfolio");
                expect(added.cID).toBe(7);
            });
        });
    });
});