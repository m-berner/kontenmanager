/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {ERROR_CODES} from "@/domains/errors";

function flattenCodes(
    obj: Record<string, unknown>,
    prefix = ""
): Array<{path: string; code: string}> {
    const out: Array<{path: string; code: string}> = [];

    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string") {
            out.push({path, code: value});
            continue;
        }

        if (value && typeof value === "object") {
            out.push(...flattenCodes(value as Record<string, unknown>, path));
        }
    }

    return out;
}

describe("ERROR_CODES", () => {
    it("uses globally unique error code values", () => {
        const flat = flattenCodes(ERROR_CODES as unknown as Record<string, unknown>);
        const seen = new Map<string, string>();
        const duplicates: string[] = [];

        for (const entry of flat) {
            const first = seen.get(entry.code);
            if (first) {
                duplicates.push(`${entry.code}: ${first} and ${entry.path}`);
                continue;
            }
            seen.set(entry.code, entry.path);
        }

        expect(duplicates).toEqual([]);
    });
});
