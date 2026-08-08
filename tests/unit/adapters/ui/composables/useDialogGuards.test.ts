/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";

describe("useDialogGuards", () => {
    const deps = {
        alertAdapter: {
            feedbackInfo: async () => undefined,
            feedbackWarning: async () => undefined,
            feedbackConfirm: async () => undefined,
            feedbackError: async () => undefined
        },
        browserAdapter: {
            getMessage: (k: string) => k
        },
        taskAdapter: {
            withRetry: async <T>(op: () => Promise<T>) => op(),
            ensureConnected: () => undefined
        }
    };

    it("should use a counter for operation IDs in withLoading", async () => {
        const {withLoading, loadingOperations} = useDialogGuards(undefined, deps);

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

    it("should reset the counter for each useDialogGuards call", async () => {
        const {withLoading: withLoading1, loadingOperations: ops1} =
            useDialogGuards(undefined, deps);
        const {withLoading: withLoading2, loadingOperations: ops2} =
            useDialogGuards(undefined, deps);

        await withLoading1(async () => {
            expect(ops1.value.has("op-1")).toBe(true);
        });

        await withLoading2(async () => {
            expect(ops2.value.has("op-1")).toBe(true);
        });
    });

    it("should allow providing a custom operationId", async () => {
        const {withLoading, loadingOperations} = useDialogGuards(undefined, deps);

        await withLoading(async () => {
            expect(loadingOperations.value.has("custom-id")).toBe(true);
        }, "custom-id");
    });

    describe("submitGuard's form validation gate", () => {
        // formRef must be the *already-unwrapped* form instance (a plain
        // {validate} object), not a Ref wrapping one - this is what
        // BaseDialogForm.vue's defineExpose formRef actually resolves to
        // when read through a parent's template ref (Vue's exposeProxy
        // auto-unwraps top-level refs via proxyRefs). Passing a Ref here
        // used to silently disable validation entirely for every dialog,
        // since `formRef.value` on the real runtime value was always
        // `undefined` - see tests/unit/adapters/ui/composables/
        // useDialogGuards.formExposeUnwrap.test.ts for the underlying Vue
        // mechanism proven against a real component mount.
        it("should NOT run operation() when the form fails validation", async () => {
            const {submitGuard} = useDialogGuards(undefined, deps);
            const operation = vi.fn().mockResolvedValue(undefined);
            const validate = vi.fn().mockResolvedValue({valid: false, errors: ["required"]});

            await submitGuard({
                formRef: {validate},
                showSystemNotification: async () => undefined,
                operation
            });

            expect(validate).toHaveBeenCalledTimes(1);
            expect(operation).not.toHaveBeenCalled();
        });

        // A failed validation used to return silently. The offending field renders
        // its own error, but that is invisible if it is scrolled out of view - so
        // pressing OK simply appeared to do nothing. That is precisely how the
        // countRules bug (every user-typed share count rejected) presented, and why
        // it went undiagnosed. Surface a warning so a blocked save is never silent.
        it("should warn the user when the form fails validation", async () => {
            const feedbackWarning = vi.fn().mockResolvedValue(undefined);
            const {submitGuard} = useDialogGuards(undefined, {
                ...deps,
                alertAdapter: {...deps.alertAdapter, feedbackWarning}
            });
            const operation = vi.fn().mockResolvedValue(undefined);
            const validate = vi.fn().mockResolvedValue({valid: false, errors: ["required"]});

            await submitGuard({
                formRef: {validate},
                errorTitle: "Add booking",
                showSystemNotification: async () => undefined,
                operation
            });

            expect(operation).not.toHaveBeenCalled();
            expect(feedbackWarning).toHaveBeenCalledTimes(1);
            expect(feedbackWarning.mock.calls[0][0]).toBe("Add booking");
            // resolveMessage falls back to browserAdapter.getMessage, which this
            // test's stub echoes back as the key itself.
            expect(feedbackWarning.mock.calls[0][1]).toBe("xx_form_invalid");
        });

        it("should NOT warn when the form passes validation", async () => {
            const feedbackWarning = vi.fn().mockResolvedValue(undefined);
            const {submitGuard} = useDialogGuards(undefined, {
                ...deps,
                alertAdapter: {...deps.alertAdapter, feedbackWarning}
            });
            const validate = vi.fn().mockResolvedValue({valid: true, errors: []});

            await submitGuard({
                formRef: {validate},
                showSystemNotification: async () => undefined,
                operation: vi.fn().mockResolvedValue(undefined)
            });

            expect(feedbackWarning).not.toHaveBeenCalled();
        });

        it("should run operation() when the form passes validation", async () => {
            const {submitGuard} = useDialogGuards(undefined, deps);
            const operation = vi.fn().mockResolvedValue(undefined);
            const validate = vi.fn().mockResolvedValue({valid: true, errors: []});

            await submitGuard({
                formRef: {validate},
                showSystemNotification: async () => undefined,
                operation
            });

            expect(validate).toHaveBeenCalledTimes(1);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        // The gate is fail-CLOSED: "no form" must be declared, not inferred from
        // formRef being falsy. 5 of the 13 dialogs calling submitGuard pass no
        // formRef at all, so that branch was not defensive — it ran routinely
        // and deliberately, which made an ACCIDENTAL undefined (every caller
        // passes `baseDialogRef.value?.formRef`, an optional chain that yields
        // undefined whenever the template ref is not populated) indistinguishable
        // from an intended omission. No warning, no log, no type-level
        // difference — one unmounted component away from turning a validated
        // save into an unvalidated one, which this parameter has already caused
        // once (round 33).
        it("should run operation() when the caller declares skipValidation", async () => {
            const {submitGuard} = useDialogGuards(undefined, deps);
            const operation = vi.fn().mockResolvedValue(undefined);

            await submitGuard({
                skipValidation: true,
                showSystemNotification: async () => undefined,
                operation
            });

            expect(operation).toHaveBeenCalledTimes(1);
        });

        it("should NOT run operation() when formRef is simply missing", async () => {
            const {submitGuard} = useDialogGuards(undefined, deps);
            const operation = vi.fn().mockResolvedValue(undefined);

            await submitGuard({
                showSystemNotification: async () => undefined,
                operation
            });

            expect(operation).not.toHaveBeenCalled();
        });

        it("should treat a null formRef (form not yet mounted) as a validation failure, matching validateForm's own contract", async () => {
            const {submitGuard} = useDialogGuards(undefined, deps);
            const operation = vi.fn().mockResolvedValue(undefined);

            await submitGuard({
                formRef: null,
                showSystemNotification: async () => undefined,
                operation
            });

            // `validateForm(formRef ?? null)` now runs, so its `form === null ->
            // invalid` branch does its job. That branch used to be unreachable
            // from its only caller: two functions in the same file disagreed
            // about what a missing form means, and the live path took the
            // permissive answer while the dead one documented the strict one.
            expect(operation).not.toHaveBeenCalled();
        });
    });

    describe("validateForm", () => {
        it("should return invalid when the form instance is null", async () => {
            const {validateForm} = useDialogGuards(undefined, deps);

            const result = await validateForm(null);

            expect(result.valid).toBe(false);
        });

        it("should delegate to the form's own validate() when present", async () => {
            const {validateForm} = useDialogGuards(undefined, deps);
            const validate = vi.fn().mockResolvedValue({valid: true, errors: []});

            const result = await validateForm({validate});

            expect(validate).toHaveBeenCalledTimes(1);
            expect(result.valid).toBe(true);
        });
    });
});
