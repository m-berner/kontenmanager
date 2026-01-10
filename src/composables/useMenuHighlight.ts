/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {computed, onUnmounted, ref} from 'vue'

export function useMenuHighlight() {
    const highlightedItems = ref<Map<number, string>>(new Map())
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()

    const highlight = (recordId: number, color = 'green') => {
        clearAllHighlights()
        highlightedItems.value.set(recordId, color)
    }

    const clearHighlight = (recordId: number) => {
        highlightedItems.value.delete(recordId)

        const timeout = timeouts.get(recordId)
        if (timeout) {
            clearTimeout(timeout)
            timeouts.delete(recordId)
        }
    }

    const clearAllHighlights = () => {
        highlightedItems.value.clear()

        for (const timeout of timeouts.values()) {
            clearTimeout(timeout)
        }
        timeouts.clear()
    }

    const highlightTemporary = (recordId: number, duration = 3000, color = 'green') => {
        highlight(recordId, color)

        const existingTimeout = timeouts.get(recordId)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        const timeout = setTimeout(() => {
            clearHighlight(recordId)
        }, duration)

        timeouts.set(recordId, timeout)
    }

    onUnmounted(() => {
        clearAllHighlights()
    })

    return {
        highlightedItems: computed(() => highlightedItems.value),
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary
    }
}
