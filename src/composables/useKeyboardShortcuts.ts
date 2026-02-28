/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {computed, onMounted, onUnmounted, ref} from "vue";
import {DomainUtils} from "@/domains/utils";

/**
 * Composable providing a simple, declarative API for registering keyboard shortcuts.
 *
 * Supports modifier combinations (Ctrl/Alt/Shift/Meta) and normalizes single-character
 * keys to uppercase to make registrations predictable across layouts.
 *
 * @example
 * const { register, enable, disable } = useKeyboardShortcuts();
 * register('Ctrl+K', () => openSearch());
 *
 * @module composables/useKeyboardShortcuts
 */
export function useKeyboardShortcuts() {
    const shortcuts = ref<Map<string, () => void>>(new Map());
    const enabled = ref(true);

    /**
     * Internal keydown handler that resolves the pressed combination and invokes
     * a registered shortcut handler when present.
     */
    const handleKeyDown = (ev: KeyboardEvent) => {
        if (!enabled.value) return;

        // Build modifier combination
        const modifiers: string[] = [];
        if (ev.ctrlKey) modifiers.push("Ctrl");
        if (ev.altKey) modifiers.push("Alt");
        if (ev.shiftKey) modifiers.push("Shift");
        if (ev.metaKey) modifiers.push("Meta");

        const key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;
        const combination = [...modifiers, key].join("+");

        const handler = shortcuts.value.get(combination);
        if (handler) {
            ev.preventDefault();
            handler();
        }
    };

    /**
     * Registers a new keyboard shortcut.
     *
     * @param combination - String like `"Ctrl+Shift+K"` or `"Alt+X"`.
     * @param handler - Callback invoked when the combination is pressed.
     */
    const register = (combination: string, handler: () => void) => {
        shortcuts.value.set(combination, handler);
    };

    /**
     * Unregisters a previously registered shortcut.
     * @param combination - Key combination to remove.
     */
    const unregister = (combination: string) => {
        shortcuts.value.delete(combination);
    };

    /**
     * Removes all registered shortcuts.
     */
    const clear = () => {
        shortcuts.value.clear();
    };

    /**
     * Disables shortcut handling.
     */
    const disable = () => {
        enabled.value = false;
    };

    /**
     * Enables shortcut handling.
     */
    const enable = () => {
        enabled.value = true;
    };

    onMounted(() => {
        window.addEventListener("keydown", handleKeyDown);
    });

    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });

    return {
        register,
        unregister,
        clear,
        disable,
        enable,
        shortcuts: computed(() => Array.from(shortcuts.value.keys())),
        enabled
    };
}

DomainUtils.log("COMPOSABLES useKeyboardShortcuts");
