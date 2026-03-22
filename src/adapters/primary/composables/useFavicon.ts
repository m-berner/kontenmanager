/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ComputedRef} from "vue";
import {computed, ref} from "vue";

import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";

/**
 * Composable that provides a favicon URL with fallback providers and
 * simple retry logic, along with loading/error state.
 *
 * @param domain - Computed domain name to fetch the icon for.
 * @param size - Preferred favicon size in pixels (default: 48).
 * @returns Reactive favicon URL, loading/error flags, and event handlers.
 * @module composables/useFavicon
 */
export function useFavicon(domain: ComputedRef<string>, size = 48) {
    const {faviconService} = useServices();
    const error = ref<boolean>(false);
    const loading = ref<boolean>(true);
    const retryCount = ref<number>(0);

    /**
     * The best-effort favicon URL based on the current retry stage.
     */
    const faviconUrl = computed(() => {
        return faviconService.getFaviconUrl(domain.value, retryCount.value, size);
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
        if (retryCount.value < faviconService.MAX_RETRIES) {
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

log("COMPOSABLES useFavicon");
