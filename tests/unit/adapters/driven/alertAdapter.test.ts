/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createAlertAdapter} from "@/adapters/driven/alertAdapter";
import type {AlertSink} from "@/adapters/driven/alertAdapter";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import {ERROR_CATEGORY} from "@/domain/constants";

describe("AlertAdapter", () => {
    let adapter: ReturnType<typeof createAlertAdapter>;
    let sink: {
        info: ReturnType<typeof vi.fn>;
        warning: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
        confirm: ReturnType<typeof vi.fn>;
    };
    const sinkFactory = (): AlertSink => sink as unknown as AlertSink;

    beforeEach(() => {
        adapter = createAlertAdapter();
        sink = {
            info: vi.fn().mockReturnValue(1),
            warning: vi.fn().mockReturnValue(2),
            error: vi.fn().mockReturnValue(3),
            confirm: vi.fn().mockResolvedValue(true)
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("does nothing and returns void when no sink is configured", async () => {
        const result = await adapter.feedbackInfo("Title", "message");
        expect(result).toBeUndefined();
    });

    it("forwards feedbackInfo to the sink with the default info duration", async () => {
        adapter.configureAlertSink(sinkFactory);

        const result = await adapter.feedbackInfo("Title", "message");

        expect(sink.info).toHaveBeenCalledWith("Title", "message", 4000);
        expect(result).toBe(1);
    });

    it("forwards feedbackError to the sink with a null (persistent) default duration", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackError("Title", "message", {});

        expect(sink.error).toHaveBeenCalledWith("Title", "message", null);
    });

    it("respects an explicit duration override", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackError("Title", "message", {duration: 999});

        expect(sink.error).toHaveBeenCalledWith("Title", "message", 999);
    });

    it("resolves the confirmation result from the sink", async () => {
        adapter.configureAlertSink(sinkFactory);

        const result = await adapter.feedbackConfirm("Title", "message");

        expect(result).toBe(true);
        expect(sink.confirm).toHaveBeenCalled();
    });

    // A confirmation is a request for input, not a fire-and-forget notification.
    // Rate-limiting it returned `undefined`, and every caller coerces that to a
    // boolean (`!!(await feedbackConfirm(...))`) — so a suppressed dialog was
    // indistinguishable from the user pressing Cancel, silently aborting an
    // import/export within the 1.5s window. Re-entrance is handled one layer
    // down: alerts.confirm() rejects when a dialog is already open.
    it("does NOT rate-limit a repeated identical confirmation", async () => {
        adapter.configureAlertSink(sinkFactory);

        const first = await adapter.feedbackConfirm("Title", "message");
        const second = await adapter.feedbackConfirm("Title", "message");

        expect(sink.confirm).toHaveBeenCalledTimes(2);
        expect(first).toBe(true);
        // Crucially not `undefined`, which callers would read as "user declined".
        expect(second).toBe(true);
    });

    it("still returns the user's actual answer on a repeated confirmation", async () => {
        adapter.configureAlertSink(sinkFactory);
        sink.confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

        expect(await adapter.feedbackConfirm("Title", "message")).toBe(true);
        expect(await adapter.feedbackConfirm("Title", "message")).toBe(false);
    });

    it("suppresses a repeated identical alert within the default rate-limit window", async () => {
        vi.useFakeTimers();
        adapter.configureAlertSink(sinkFactory);

        const first = await adapter.feedbackInfo("Title", "message");
        const second = await adapter.feedbackInfo("Title", "message");

        expect(first).toBe(1);
        expect(second).toBeUndefined();
        expect(sink.info).toHaveBeenCalledTimes(1);
    });

    it("allows a repeated alert once the rate-limit window elapses", async () => {
        vi.useFakeTimers();
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title", "message");
        vi.advanceTimersByTime(1500);
        await adapter.feedbackInfo("Title", "message");

        expect(sink.info).toHaveBeenCalledTimes(2);
    });

    it("does not rate-limit distinct titles/messages", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title A", "message");
        await adapter.feedbackInfo("Title B", "message");

        expect(sink.info).toHaveBeenCalledTimes(2);
    });

    it("bypasses rate limiting entirely when rateLimitMs is 0", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title", "message", {rateLimitMs: 0});
        await adapter.feedbackInfo("Title", "message", {rateLimitMs: 0});

        expect(sink.info).toHaveBeenCalledTimes(2);
    });

    it("stays a safe no-op if the configured sink factory throws", async () => {
        adapter.configureAlertSink(() => {
            throw new Error("sink unavailable");
        });

        await expect(adapter.feedbackInfo("Title", "message")).resolves.toBeUndefined();
    });

    it("normalizes a plain Error into 'name\\nmessage'", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title", new Error("boom"));

        expect(sink.info).toHaveBeenCalledWith("Title", "Error\nboom", 4000);
    });

    it("normalizes an AppError into 'category\\nmessage'", async () => {
        adapter.configureAlertSink(sinkFactory);
        const err = appError(ERROR_DEFINITIONS.UTILS.C.CODE, ERROR_CATEGORY.VALIDATION, false);

        await adapter.feedbackInfo("Title", err);

        expect(sink.info).toHaveBeenCalledWith("Title", `${err.category}\n${err.message}`, 4000);
    });

    it("normalizes an array of strings by joining with newlines", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title", ["line one", "line two"]);

        expect(sink.info).toHaveBeenCalledWith("Title", "line one\nline two", 4000);
    });

    it("falls back to 'Unknown error' for an unrecognized error shape", async () => {
        adapter.configureAlertSink(sinkFactory);

        await adapter.feedbackInfo("Title", {weird: true});

        expect(sink.info).toHaveBeenCalledWith("Title", "Unknown error", 4000);
    });
});