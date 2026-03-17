/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {alertService} from "@/services/alert";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {ERROR_CATEGORY} from "@/constants";

const {storeMock, logMock} = vi.hoisted(() => ({
    storeMock: {
        info: vi.fn(),
        warning: vi.fn(),
        confirm: vi.fn(),
        error: vi.fn()
    },
    logMock: vi.fn()
}));

vi.mock("@/stores/alerts", () => ({
    useAlertsStore: vi.fn(() => storeMock)
}));

vi.mock("@/domains/utils/utils", () => ({
    log: logMock
}));

vi.mock("@/domains/errors", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/domains/errors")>();

    const findErrorMsg = (node: unknown, code: string): string | undefined => {
        if (!node || typeof node !== "object") return undefined;
        if ("CODE" in node && "MSG" in node) {
            const asCode = (node as { CODE?: unknown }).CODE;
            const asMsg = (node as { MSG?: unknown }).MSG;
            return typeof asCode === "string" && asCode === code && typeof asMsg === "string"
                ? asMsg
                : undefined;
        }
        for (const child of Object.values(node as Record<string, unknown>)) {
            const result = findErrorMsg(child, code);
            if (result !== undefined) return result;
        }
        return undefined;
    };

    return {
        ...actual,
        isAppError: vi.fn((err) => (err as { name?: unknown } | null)?.name === "AppError"),
        appError: vi.fn((code, category) => {
            const message =
                typeof code === "string"
                    ? (findErrorMsg(actual.ERROR_DEFINITIONS, code) ?? code)
                    : String(code);
            return Object.assign(new Error(message), {
                name: "AppError",
                category
            });
        })
    };
});

describe("AlertService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("feedbackInfo should normalize strings and use the default duration", async () => {
        storeMock.info.mockReturnValueOnce(10);

        const result = await alertService.feedbackInfo("Info", "text message");

        expect(result).toBe(10);
        expect(storeMock.info).toHaveBeenCalledWith("Info", "text message", 4000);
    });

    it("feedbackWarning should normalize Error and use default duration", async () => {
        const error = new Error("disk full");
        storeMock.warning.mockReturnValueOnce(11);

        const result = await alertService.feedbackWarning("Warn", error);

        expect(result).toBe(11);
        expect(storeMock.warning).toHaveBeenCalledWith(
            "Warn",
            "Error\ndisk full",
            4000
        );
    });

    it("feedbackConfirm should pass the normalized array message and confirm options", async () => {
        storeMock.confirm.mockResolvedValueOnce(true);

        const result = await alertService.feedbackConfirm("Confirm", ["line1", "line2"], {
            confirm: {
                confirmText: "Yes",
                cancelText: "No",
                type: "warning"
            }
        });

        expect(result).toBe(true);
        expect(storeMock.confirm).toHaveBeenCalledWith("Confirm", "line1\nline2", {
            confirmText: "Yes",
            cancelText: "No",
            type: "warning"
        });
    });

    it("feedbackError should log context and call error alert with the default duration", async () => {
        const error = new Error("boom");
        error.stack = "stack trace";
        storeMock.error.mockReturnValueOnce(12);

        const result = await alertService.feedbackError("Failure", error, {
            logLevel: "error",
            data: {id: 5},
            correlationId: "corr-1"
        });

        expect(result).toBe(12);
        expect(logMock).toHaveBeenCalledWith(
            "SERVICES alert Failure: Error\nboom",
            {id: 5, correlationId: "corr-1", errorStack: "stack trace"},
            "error"
        );
        expect(storeMock.error).toHaveBeenCalledWith("Failure", "Error\nboom", null);
    });

    it("feedbackError should normalize AppError category and message", async () => {
        storeMock.error.mockReturnValueOnce(13);

        const result = await alertService.feedbackError("Business", appError(ERROR_DEFINITIONS.SERVICES.APP.FEEDBACK.CODE, ERROR_CATEGORY.BUSINESS), {});

        expect(result).toBe(13);
        expect(storeMock.error).toHaveBeenCalledWith(
            "Business",
            "business\nTranslated message",
            null
        );
    });

    it("should rate-limit duplicate messages with the default interval", async () => {
        storeMock.info.mockReturnValue(20);

        const first = await alertService.feedbackInfo("Info", "same");
        const second = await alertService.feedbackInfo("Info", "same");

        expect(first).toBe(20);
        expect(second).toBeUndefined();
        expect(storeMock.info).toHaveBeenCalledTimes(1);
    });

    it("should allow duplicate messages when rateLimitMs is zero", async () => {
        storeMock.warning.mockReturnValue(21);

        const first = await alertService.feedbackWarning("Warn", "same", {rateLimitMs: 0});
        const second = await alertService.feedbackWarning("Warn", "same", {rateLimitMs: 0});

        expect(first).toBe(21);
        expect(second).toBe(21);
        expect(storeMock.warning).toHaveBeenCalledTimes(2);
    });

    it("should support custom durations and unknown error normalization", async () => {
        storeMock.info.mockReturnValueOnce(22);

        const result = await alertService.feedbackInfo("Info", {invalid: true}, {
            duration: 7000
        });

        expect(result).toBe(22);
        expect(storeMock.info).toHaveBeenCalledWith("Info", "Unknown error", 7000);
    });
});
