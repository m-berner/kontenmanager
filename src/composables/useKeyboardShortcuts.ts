/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {computed, onMounted, onUnmounted, ref} from 'vue'

// ============================================================
// Keyboard shortcuts
// ============================================================

export function useKeyboardShortcuts() {

    const shortcuts = ref<Map<string, () => void>>(new Map())
    const enabled = ref(true)

    const handleKeyDown = (ev: KeyboardEvent) => {
        if (!enabled.value) return

        // Build modifier combination
        const modifiers: string[] = []
        if (ev.ctrlKey) modifiers.push('Ctrl')
        if (ev.altKey) modifiers.push('Alt')
        if (ev.shiftKey) modifiers.push('Shift')
        if (ev.metaKey) modifiers.push('Meta')

        const key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key
        const combination = [...modifiers, key].join('+')

        const handler = shortcuts.value.get(combination)
        if (handler) {
            ev.preventDefault()
            handler()
        }
    }

    const register = (combination: string, handler: () => void) => {
        shortcuts.value.set(combination, handler)
    }

    const unregister = (combination: string) => {
        shortcuts.value.delete(combination)
    }

    const clear = () => {
        shortcuts.value.clear()
    }

    const disable = () => {
        enabled.value = false
    }

    const enable = () => {
        enabled.value = true
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })

    return {
        register,
        unregister,
        clear,
        disable,
        enable,
        shortcuts: computed(() => Array.from(shortcuts.value.keys())),
        enabled
    }
}
