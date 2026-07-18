/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {INDEXED_DB} from "@/domain/constants";

describe("INDEXED_DB.STORE.BOOKING_TYPES", () => {
    it("keeps CREDIT/DEBIT (legacy cType values) numerically equal to OTHER/FEE (new cBookingTypeID values)", () => {
        // domain/importExport/transformer.ts switches legacy bookings on
        // CREDIT/DEBIT and, in the common case, infers the new booking type
        // as OTHER/FEE. These pairs must stay equal or legacy import
        // classification breaks silently.
        const {CREDIT, DEBIT, OTHER, FEE} = INDEXED_DB.STORE.BOOKING_TYPES;
        expect(CREDIT).toBe(OTHER);
        expect(DEBIT).toBe(FEE);
    });
});
