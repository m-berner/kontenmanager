/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {createTaskService} from "@/adapters/secondary/taskService";

describe("TaskService", () => {
    const taskService = createTaskService();

    describe("withRetry", () => {
        it("should return the result of the operation if it succeeds on first try", async () => {
            const operation = vi.fn().mockResolvedValue("success");
            const result = await taskService.withRetry(operation);
            expect(result).toBe("success");
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it("should retry the operation on failure and succeed if it eventually passes", async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("success");

            const result = await taskService.withRetry(operation, {delay: 0});
            expect(result).toBe("success");
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it("should throw AppError if all retries fail", async () => {
            const operation = vi.fn().mockRejectedValue(new Error("fail"));

            await expect(taskService.withRetry(operation, {maxRetries: 2, delay: 0}))
                .rejects.toThrow();
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it("should call onRetry callback", async () => {
            const onRetry = vi.fn();
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("success");

            await taskService.withRetry(operation, {onRetry, delay: 0});
            expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
        });
    });

    describe("ensureConnected", () => {
        it("should not throw if connected", () => {
            expect(() => taskService.ensureConnected(true)).not.toThrow();
        });

        it("should throw error if not connected", () => {
            expect(() => taskService.ensureConnected(false, "No connection"))
                .toThrow("No connection");
        });
    });
});
