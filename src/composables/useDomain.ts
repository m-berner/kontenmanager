/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {Ref} from 'vue'
import {computed} from 'vue'

export function useDomain(url: Ref<string>) {
    const domain = computed(() => {
        if (!url.value) return ''
        try {
            let processedUrl = url.value
            if (!processedUrl.startsWith('http')) {
                processedUrl = `https://${processedUrl}`
            }
            const urlObj = new URL(processedUrl)
            return urlObj.hostname.replace(/^www\./, '')
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return ''
        }
    })

    const subdomain = computed(() => {
        if (!url.value) return null
        try {
            const urlObj = new URL(url.value.startsWith('http') ? url.value : `https://${url.value}`)
            const parts = urlObj.hostname.split('.')
            if (parts.length > 2) {
                return parts[0] !== 'www' ? parts[0] : null
            }
            return null
        } catch {
            return null
        }
    })

    const protocol = computed(() => {
        if (!url.value) return null

        try {
            const urlObj = new URL(
                url.value.startsWith('http') ? url.value : `https://${url.value}`
            )
            return urlObj.protocol.replace(':', '')
        } catch {
            return null
        }
    })

    const pathname = computed(() => {
        if (!url.value) return null

        try {
            const urlObj = new URL(
                url.value.startsWith('http') ? url.value : `https://${url.value}`
            )
            return urlObj.pathname
        } catch {
            return null
        }
    })

    return {
        domain,
        subdomain,
        protocol,
        pathname
    }
}
