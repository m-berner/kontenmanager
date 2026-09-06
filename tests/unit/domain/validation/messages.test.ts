/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {createIbanMessages, createSwiftMessages} from "@/domain/validation/messages";

// These factories are consumed positionally: `validationAdapter.ibanRules`/
// `swiftRules` index into the returned array by number (msgArray[0], [1], ...)
// rather than by key, so the ORDER these functions call `t()` in is load-bearing
// — a silent reorder here would show the wrong message for a given failure
// (e.g. a checksum failure displaying the "duplicate" text) without any type
// error to catch it. `ibanRules`/`swiftRules`'s own tests only exercise a
// hand-built msgArray, so they can't catch this factory drifting out of sync
// with them; this test is what actually pins the two together.
describe("domain/validation/messages", () => {
    describe("createIbanMessages", () => {
        it("calls t with the keys in the order ibanRules indexes by", () => {
            const calls: string[] = [];
            const t = (key: string): string => {
                calls.push(key);
                return key;
            };

            const messages = createIbanMessages(t);

            expect(calls).toEqual([
                "validators.ibanRules.required",
                "validators.ibanRules.length",
                "validators.ibanRules.format",
                "validators.ibanRules.country",
                "validators.ibanRules.checksum",
                "validators.ibanRules.duplicate"
            ]);
            // ibanRules reads msgArray[0..5] for required/length/format/country/
            // checksum/duplicate respectively - same order as the calls above.
            expect(messages).toEqual(calls);
        });
    });

    describe("createSwiftMessages", () => {
        it("calls t with the keys in the order swiftRules indexes by", () => {
            const calls: string[] = [];
            const t = (key: string): string => {
                calls.push(key);
                return key;
            };

            const messages = createSwiftMessages(t);

            expect(calls).toEqual([
                "validators.swiftRules.required",
                "validators.swiftRules.length",
                "validators.swiftRules.format"
            ]);
            // swiftRules reads msgArray[0..2] for required/length/format - same
            // order as the calls above.
            expect(messages).toEqual(calls);
        });
    });
});
