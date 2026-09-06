/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {createApp, defineComponent, h, nextTick, ref} from "vue";

import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";

/**
 * Regression test for a bug that survived every prior audit round because no
 * test exercised the real Vue component-instance mechanism: BaseDialogForm.vue
 * holds a `formRef = ref<FormContract | null>(null)` and does
 * `defineExpose({formRef})`. Every Add/Update dialog reads it back through a
 * parent template ref as `baseDialogRef.value?.formRef` and passes that into
 * `submitGuard({formRef: ...})`.
 *
 * Vue's `getExposeProxy` wraps the exposed object in `proxyRefs`, which
 * auto-unwraps top-level refs - so `baseDialogRef.value.formRef` is the
 * *already-unwrapped* form instance, not a `Ref`. `submitGuard` used to be
 * typed (and coded) as if it received a `Ref<FormContract | null>`, so its
 * `formRef.value` access was always `undefined` and validation silently
 * never ran, for every dialog, since the initial commit.
 *
 * This test mounts a minimal component tree that mirrors the real
 * BaseDialogForm.vue + Add/UpdateX.vue wiring exactly (defineExpose Ref,
 * read back through a template ref) and drives it through the actual
 * `useDialogGuards` composable, so it fails if this specific unwrapping
 * mismatch is ever reintroduced - unlike the deps-mocked tests in
 * useDialogGuards.test.ts, which pass an already-unwrapped object directly
 * and would not have caught this class of bug.
 */
describe("submitGuard + defineExpose formRef (real Vue component-instance wiring)", () => {
    it("actually invokes the child form's validate() and blocks operation() when invalid", async () => {
        const validate = async () => ({valid: false, errors: ["required"]});

        // Mirrors BaseDialogForm.vue exactly: internal formRef, defineExpose({formRef}).
        const BaseDialogFormLike = defineComponent({
            setup(_props, {expose}) {
                const formRef = ref<{ validate: typeof validate } | null>(null);
                expose({formRef});
                return () =>
                    h("form", {
                        ref: (el: unknown) => {
                            formRef.value = el ? {validate} : null;
                        }
                    });
            }
        });

        const childRef = ref<{ formRef?: { validate: typeof validate } | null } | null>(null);
        const container = document.createElement("div");
        document.body.appendChild(container);

        const {submitGuard} = useDialogGuards(undefined, {
            alertAdapter: {
                feedbackInfo: async () => undefined,
                feedbackWarning: async () => undefined,
                feedbackConfirm: async () => undefined,
                feedbackError: async () => undefined
            },
            browserAdapter: {getMessage: (k: string) => k},
            taskAdapter: {
                withRetry: async <T, >(op: () => Promise<T>) => op(),
                ensureConnected: () => undefined
            }
        });

        let operationRan = false;
        const app = createApp({
            render: () => h(BaseDialogFormLike, {ref: childRef})
        });
        app.mount(container);
        await nextTick();

        await submitGuard({
            // Mirrors every real dialog's onClickOk exactly:
            // `formRef: baseDialogRef.value?.formRef`.
            formRef: childRef.value?.formRef,
            showSystemNotification: async () => undefined,
            operation: async () => {
                operationRan = true;
            }
        });

        expect(operationRan).toBe(false);

        app.unmount();
        container.remove();
    });
});
