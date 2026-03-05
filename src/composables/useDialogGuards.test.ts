/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {useDialogGuards} from "./useDialogGuards";

describe("useDialogGuards", () => {
    it("should use a counter for operation IDs in withLoading", async () => {
        const {withLoading, loadingOperations} = useDialogGuards();

        const op1 = withLoading(async () => {
            expect(loadingOperations.value.has("op-1")).toBe(true);
            await new Promise((resolve) => setTimeout(resolve, 10));
        });

        const op2 = withLoading(async () => {
            expect(loadingOperations.value.has("op-2")).toBe(true);
            await new Promise((resolve) => setTimeout(resolve, 10));
        });

        await Promise.all([op1, op2]);

        expect(loadingOperations.value.size).toBe(0);
    });

    it("should reset counter for each useDialogGuards call", async () => {
        const {withLoading: withLoading1, loadingOperations: ops1} =
            useDialogGuards();
        const {withLoading: withLoading2, loadingOperations: ops2} =
            useDialogGuards();

        await withLoading1(async () => {
            expect(ops1.value.has("op-1")).toBe(true);
        });

        await withLoading2(async () => {
            expect(ops2.value.has("op-1")).toBe(true);
        });
    });

    it("should allow providing a custom operationId", async () => {
        const {withLoading, loadingOperations} = useDialogGuards();

        await withLoading(async () => {
            expect(loadingOperations.value.has("custom-id")).toBe(true);
        }, "custom-id");
    });
});
