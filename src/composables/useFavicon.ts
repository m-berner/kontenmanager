/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ComputedRef} from "vue";
import {computed, ref} from "vue";
import {DomainUtils} from "@/domains/utils";

/**
 * Composable that provides a favicon URL with fallback providers and
 * simple retry logic, along with loading/error state.
 *
 * Providers chain:
 * 1. Google S2 favicons (requested size)
 * 2. DuckDuckGo IP3 `.ico`
 * 3. Google S2 16px as final fallback
 *
 * @param domain - Computed domain name to fetch the icon for.
 * @param size - Preferred favicon size in pixels (default: 48).
 * @returns Reactive favicon URL, loading/error flags, and event handlers.
 * @module composables/useFavicon
 */
export function useFavicon(domain: ComputedRef<string>, size = 48) {
    const error = ref<boolean>(false);
    const loading = ref<boolean>(true);
    const retryCount = ref<number>(0);
    const MAX_RETRIES = 2;

    /**
     * The best-effort favicon URL based on the current retry stage.
     */
    const faviconUrl = computed(() => {
        if (domain.value.length <= 4) return "";

        if (retryCount.value === 0) {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=${size}`;
        } else if (retryCount.value === 1) {
            return `https://icons.duckduckgo.com/ip3/${domain.value}.ico`;
        } else {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=16`;
        }
    });

    /**
     * Image load event handler. Resets state to success.
     */
    function onLoad() {
        loading.value = false;
        error.value = false;
    }

    /**
     * Image error event handler. Advances to the next provider or marks error.
     */
    function onError() {
        if (retryCount.value < MAX_RETRIES) {
            retryCount.value++;
            loading.value = true;
        } else {
            error.value = true;
            loading.value = false;
        }
    }

    /**
     * Resets state to retry from the first provider.
     */
    function reset() {
        error.value = false;
        loading.value = true;
        retryCount.value = 0;
    }

    return {
        faviconUrl,
        loading,
        error,
        onLoad,
        onError,
        reset
    };
}

DomainUtils.log("COMPOSABLES useFavicon");
