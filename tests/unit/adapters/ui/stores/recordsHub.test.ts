/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {makeAccountDb, makeBookingDb} from "@test/usecases";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

describe("Records Hub Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
    });

    it("isDepot is false when no active account is selected", () => {
        const records = useRecordsStore();
        expect(records.isDepot).toBe(false);
    });

    it("isDepot reflects the active account's withDepot flag", () => {
        const settings = useSettingsStore();
        const records = useRecordsStore();
        records.accounts.add(makeAccountDb({cID: 1, cWithDepot: true}));
        settings.activeAccountId = 1;

        expect(records.isDepot).toBe(true);
    });

    it("clean() clears all entity stores including accounts by default", () => {
        const records = useRecordsStore();
        records.accounts.add(makeAccountDb({cID: 1}));
        records.bookings.add(makeBookingDb({cID: 1}));

        records.clean();

        expect(records.accounts.items).toHaveLength(0);
        expect(records.bookings.items).toHaveLength(0);
    });

    it("clean(false) preserves accounts but clears the other entity stores", () => {
        const records = useRecordsStore();
        records.accounts.add(makeAccountDb({cID: 1}));
        records.bookings.add(makeBookingDb({cID: 1}));

        records.clean(false);

        expect(records.accounts.items).toHaveLength(1);
        expect(records.bookings.items).toHaveLength(0);
    });

    it("init() hydrates all entity stores from the given data", async () => {
        const records = useRecordsStore();

        await records.init(
            {
                accountsDB: [makeAccountDb({cID: 1})],
                bookingsDB: [makeBookingDb({cID: 1})],
                bookingTypesDB: [],
                stocksDB: []
            },
            {}
        );

        expect(records.accounts.items).toHaveLength(1);
        expect(records.bookings.items).toHaveLength(1);
    });
});