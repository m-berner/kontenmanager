/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {appError, ERROR_DEFINITIONS, type ErrorCodes, serializeError,} from "@/domain/errors";
import {ERROR_CATEGORY} from "@/domain/constants";

// appError translates via globalThis.browser.i18n.getMessage when available.
(globalThis as unknown as { browser?: unknown }).browser = {
    i18n: {
        getMessage: vi.fn((key: string) => {
            if (key === "xx_error_code") return "Error code";
            if (key === "xx_missing_translation") return "Missing translation";
            return "";
        }),
    },
};

describe("appError lookup", () => {
    it("finds messages for top-level error codes", () => {
        const err = appError(ERROR_DEFINITIONS.ADD_ACCOUNT.CODE, ERROR_CATEGORY.BUSINESS);
        expect(err.message).toBe(ERROR_DEFINITIONS.ADD_ACCOUNT.MSG);
    });

    it("finds messages for nested error codes", () => {
        const err = appError(ERROR_DEFINITIONS.USE_DIALOG_GUARDS.A.CODE, ERROR_CATEGORY.BUSINESS);
        expect(err.message).toBe(ERROR_DEFINITIONS.USE_DIALOG_GUARDS.A.MSG);
    });

    it("falls back for unknown codes", () => {
        const err = appError("#unknown" as unknown as ErrorCodes, ERROR_CATEGORY.BUSINESS);
        expect(err.message).toBe("Error code: #unknown");
    });
});

function flattenCodes(
    obj: Record<string, unknown>,
    prefix = ""
): Array<{ path: string; code: string }> {
    const out: Array<{ path: string; code: string }> = [];

    const codeValue = (obj as { CODE?: unknown }).CODE;
    if (typeof codeValue === "string") {
        out.push({
            path: prefix ? `${prefix}.CODE` : "CODE",
            code: codeValue
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

describe("serializeError", () => {
    it("preserves an AppError's code, category and context", () => {
        // Regression test: this used to return only {name, message}, throwing
        // away `context` — the {storeName, url, tabId, ...} payload each
        // appError() call site attaches, and the only thing distinguishing two
        // occurrences of the same error. It is the serializer on nearly every
        // diagnostic path (transactionManager, taskAdapter, useDialogGuards,
        // appAdapter, browserAdapter).
        const err = appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE as ErrorCodes,
            ERROR_CATEGORY.DATABASE,
            true,
            {storeName: "accounts", attempt: 2}
        );

        expect(serializeError(err)).toEqual({
            name: "AppError",
            message: ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.MSG,
            code: ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE,
            category: ERROR_CATEGORY.DATABASE,
            context: {storeName: "accounts", attempt: 2}
        });
    });

    it("omits context entirely when the AppError carries none", () => {
        const err = appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE as ErrorCodes,
            ERROR_CATEGORY.DATABASE,
            true
        );

        expect(serializeError(err)).not.toHaveProperty("context");
    });

    it("falls back to name/message for a plain Error", () => {
        expect(serializeError(new TypeError("boom"))).toEqual({
            name: "TypeError",
            message: "boom"
        });
    });

    // `name: "UnknownError"`, not "AppError". Stamping "AppError" here made the
    // log line indistinguishable from a genuine AppError whose code lookup had
    // failed, hiding the one thing this branch actually knows: that it was
    // handed something that is not an error at all. `thrownType` preserves it.
    // This is the serializer on nearly every diagnostic path in the app.
    it("labels a non-error value as UnknownError and records what was thrown", () => {
        expect(serializeError("just a string")).toEqual({
            name: "UnknownError",
            message: ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG,
            thrownType: "string"
        });
    });

    it("distinguishes null from an object in thrownType", () => {
        expect(serializeError(null)).toEqual({
            name: "UnknownError",
            message: ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG,
            thrownType: "null"
        });
        expect(serializeError({some: "duck"})).toEqual({
            name: "UnknownError",
            message: ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG,
            thrownType: "object"
        });
    });
});

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
