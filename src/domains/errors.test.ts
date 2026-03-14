/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import { appError, ERROR_DEFINITIONS } from "@/domains/errors";

// Mock browserService since it's used in appError
vi.mock("@/services/browserService", () => ({
    browserService: {
        getMessage: vi.fn((key) => {
            if (key === "xx_error_code") return "Error code";
            return null;
        }),
    },
}));

describe("appError lookup", () => {
    it("finds messages for top-level error codes", () => {
        const err = appError(ERROR_DEFINITIONS.ADD_ACCOUNT.CODE, "TECHNICAL");
        expect(err.message).toBe(ERROR_DEFINITIONS.ADD_ACCOUNT.MSG);
    });

    it("finds messages for nested error codes", () => {
        const err = appError(ERROR_DEFINITIONS.USE_DIALOG_GUARDS.A.CODE, "TECHNICAL");
        expect(err.message).toBe(ERROR_DEFINITIONS.USE_DIALOG_GUARDS.A.MSG);
    });

    it("falls back for unknown codes", () => {
        const err = appError("#unknown" as any, "TECHNICAL");
        expect(err.message).toBe("Error code: #unknown");
    });
});

function flattenCodes(
    obj: Record<string, unknown>,
    prefix = ""
): Array<{ path: string; code: string }> {
    const out: Array<{ path: string; code: string }> = [];

    if ("CODE" in obj && typeof (obj as any).CODE === "string") {
        out.push({
            path: prefix ? `${prefix}.CODE` : "CODE",
            code: (obj as any).CODE
        });
        return out;
    }

    for (const [key, value] of Object.entries(obj)) {
        if (!value || typeof value !== "object") continue;
        const path = prefix ? `${prefix}.${key}` : key;
        out.push(...flattenCodes(value as Record<string, unknown>, path));
    }

    return out;
}

describe("ERROR_DEFINITIONS", () => {
    it("uses globally unique error code values", () => {
        const flat = flattenCodes(ERROR_DEFINITIONS as unknown as Record<string, unknown>);
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
