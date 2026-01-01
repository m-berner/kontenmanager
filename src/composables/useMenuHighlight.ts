/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {onUnmounted, ref} from 'vue'

export function useMenuHighlight() {
    const highlightedItems = ref<Map<number, string>>(new Map())

    const highlight = (recordId: number, color = 'green') => {
    // Clear all highlights first
        highlightedItems.value.clear()
        highlightedItems.value.set(recordId, color)
    }

    const clearHighlight = (recordId: number) => {
        highlightedItems.value.delete(recordId)
    }

    const clearAllHighlights = () => {
        highlightedItems.value.clear()
    }

    // Auto-clear highlights after 3 seconds
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const highlightTemporary = (recordId: number, duration = 3000) => {
        highlight(recordId)

        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => clearHighlight(recordId), duration)
    }

    onUnmounted(() => {
        if (timeoutId) clearTimeout(timeoutId)
    })

    return {
        highlightedItems,
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary
    }
}
