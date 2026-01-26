/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {ComputedRef} from 'vue'
import {computed, ref} from 'vue'

export function useFavicon(domain: ComputedRef<string>, size = 48) {
    const error = ref<boolean>(false)
    const loading = ref<boolean>(true)
    const retryCount = ref<number>(0)
    const MAX_RETRIES = 2

    const faviconUrl = computed(() => {
        if (domain.value.length <= 4) return ''

        if (retryCount.value === 0) {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=${size}`
        } else if (retryCount.value === 1) {
            return `https://icons.duckduckgo.com/ip3/${domain.value}.ico`
        } else {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=16`
        }
    })

    function onLoad() {
        loading.value = false
        error.value = false
    }

    function onError() {
        if (retryCount.value < MAX_RETRIES) {
            retryCount.value++
            loading.value = true
        } else {
            error.value = true
            loading.value = false
        }
    }

    function reset() {
        error.value = false
        loading.value = true
        retryCount.value = 0
    }

    return {
        faviconUrl,
        loading,
        error,
        onLoad,
        onError,
        reset
    }
}
