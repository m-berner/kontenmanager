/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";

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
    useAlertStore: vi.fn(() => storeMock)
}));

vi.mock("@/domains/utils", () => ({
    DomainUtils: {
        log: logMock
    }
}));

vi.mock("@/domains/errors", () => ({
    AppError: class AppError extends Error {
        category: string;

        constructor(code: string, category: string) {
            super(code);
            this.name = "AppError";
            this.category = category;
        }
    }
}));

import {AlertService} from "./alert";
import {AppError} from "@/domains/errors";

describe("AlertService", () => {
    let service: AlertService;

    beforeEach(() => {
        service = new AlertService();
        vi.clearAllMocks();
    });

    it("handleUserInfo should normalize strings and use default duration", async () => {
        storeMock.info.mockReturnValueOnce(10);

        const result = await service.handleUserInfo("Info", "text message");

        expect(result).toBe(10);
        expect(storeMock.info).toHaveBeenCalledWith("Info", "text message", 4000);
    });

    it("handleUserWarning should normalize Error and use default duration", async () => {
        const error = new Error("disk full");
        storeMock.warning.mockReturnValueOnce(11);

        const result = await service.handleUserWarning("Warn", error);

        expect(result).toBe(11);
        expect(storeMock.warning).toHaveBeenCalledWith(
            "Warn",
            "Error\ndisk full",
            4000
        );
    });

    it("handleUserConfirm should pass normalized array message and confirm options", async () => {
        storeMock.confirm.mockResolvedValueOnce(true);

        const result = await service.handleUserConfirm("Confirm", ["line1", "line2"], {
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

    it("handleUserError should log context and call error alert with default duration", async () => {
        const error = new Error("boom");
        error.stack = "stack trace";
        storeMock.error.mockReturnValueOnce(12);

        const result = await service.handleUserError("Failure", error, {
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

    it("handleUserError should normalize AppError category and message", async () => {
        const appError = new AppError("Translated message", "business");
        storeMock.error.mockReturnValueOnce(13);

        const result = await service.handleUserError("Business", appError, {});

        expect(result).toBe(13);
        expect(storeMock.error).toHaveBeenCalledWith(
            "Business",
            "business\nTranslated message",
            null
        );
    });

    it("should rate-limit duplicate messages with default interval", async () => {
        storeMock.info.mockReturnValue(20);

        const first = await service.handleUserInfo("Info", "same");
        const second = await service.handleUserInfo("Info", "same");

        expect(first).toBe(20);
        expect(second).toBeUndefined();
        expect(storeMock.info).toHaveBeenCalledTimes(1);
    });

    it("should allow duplicate messages when rateLimitMs is zero", async () => {
        storeMock.warning.mockReturnValue(21);

        const first = await service.handleUserWarning("Warn", "same", {rateLimitMs: 0});
        const second = await service.handleUserWarning("Warn", "same", {rateLimitMs: 0});

        expect(first).toBe(21);
        expect(second).toBe(21);
        expect(storeMock.warning).toHaveBeenCalledTimes(2);
    });

    it("should support custom durations and unknown error normalization", async () => {
        storeMock.info.mockReturnValueOnce(22);

        const result = await service.handleUserInfo("Info", {invalid: true}, {
            duration: 7000
        });

        expect(result).toBe(22);
        expect(storeMock.info).toHaveBeenCalledWith("Info", "Unknown error", 7000);
    });
});
