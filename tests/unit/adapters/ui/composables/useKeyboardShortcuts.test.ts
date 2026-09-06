/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {useKeyboardShortcuts} from "@/adapters/ui/composables/useKeyboardShortcuts";

// Note: `onMounted`/`onUnmounted` are no-ops outside an active Vue component instance
// (no @vue/test-utils `mount()` in this project's toolchain), so the actual
// `window.addEventListener("keydown", ...)` wiring cannot be exercised here. This
// covers the composable's public state-management contract only.
describe("useKeyboardShortcuts", () => {
    it("register() adds a combination to the tracked shortcuts list", () => {
        const {register, shortcuts} = useKeyboardShortcuts();
        register("Ctrl+K", () => undefined);

        expect(shortcuts.value).toContain("Ctrl+K");
    });

    it("unregister() removes a previously registered combination", () => {
        const {register, unregister, shortcuts} = useKeyboardShortcuts();
        register("Ctrl+K", () => undefined);

        unregister("Ctrl+K");

        expect(shortcuts.value).not.toContain("Ctrl+K");
    });

    it("clear() removes all registered combinations", () => {
        const {register, clear, shortcuts} = useKeyboardShortcuts();
        register("Ctrl+K", () => undefined);
        register("Alt+X", () => undefined);

        clear();

        expect(shortcuts.value).toEqual([]);
    });

    it("starts enabled", () => {
        const {enabled} = useKeyboardShortcuts();
        expect(enabled.value).toBe(true);
    });

    it("disable()/enable() toggle the enabled flag", () => {
        const {disable, enable, enabled} = useKeyboardShortcuts();

        disable();
        expect(enabled.value).toBe(false);

        enable();
        expect(enabled.value).toBe(true);
    });

    it("each call returns an independent shortcut registry", () => {
        const first = useKeyboardShortcuts();
        const second = useKeyboardShortcuts();

        first.register("Ctrl+K", () => undefined);

        expect(first.shortcuts.value).toContain("Ctrl+K");
        expect(second.shortcuts.value).not.toContain("Ctrl+K");
    });
});