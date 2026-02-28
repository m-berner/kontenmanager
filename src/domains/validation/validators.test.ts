/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {DomainValidators} from "@/domains/validation/validators";
import {DomainUtils} from "@/domains/utils";

describe("DomainValidators: normalizeDate behavior", () => {
    it("returns empty string for invalid date input instead of current day", () => {
        const logSpy = vi.spyOn(DomainUtils, "log").mockImplementation(() => {});

        const booking = DomainValidators.validateBooking({
            cID: 1,
            cBookDate: "not-a-date",
            cExDate: Number.NaN
        });

        expect(booking.cBookDate).toBe("");
        expect(booking.cExDate).toBe("");
        expect(logSpy).toHaveBeenCalled();
    });

    it("keeps valid ISO date and converts valid numeric timestamp", () => {
        const timestamp = Date.UTC(2026, 0, 2);
        const booking = DomainValidators.validateBooking({
            cID: 1,
            cBookDate: "2026-01-03",
            cExDate: timestamp
        });

        expect(booking.cBookDate).toBe("2026-01-03");
        expect(booking.cExDate).toBe("2026-01-02");
    });
});
