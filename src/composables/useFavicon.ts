/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {computed, ref} from 'vue'

export const useFavicon = (domain: string, size = 48) => {
    const error = ref(false)
    const loading = ref(true)

    const faviconUrl = computed(() => {
        if (domain.length > 4) {
            if (error.value) {
                return `https://icons.duckduckgo.com/ip3/${domain}.ico`
            }
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
        }
        return ''
    })

    function onLoad() {
        loading.value = false
    }

    function onError() {
        if (!error.value) {
            error.value = true
            loading.value = false
        }
    }

    function reset() {
        error.value = false
        loading.value = true
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
