/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export type FaviconAdapter = ReturnType<typeof createFaviconAdapter>;

/**
 * Service that provides favicon URLs with fallback providers.
 *
 * Providers chain:
 * 1. Google S2 favicons (requested size)
 * 2. DuckDuckGo IP3 `.ico`
 * 3. Google S2 16px as the final fallback
 */
export function createFaviconAdapter() {
    const MAX_RETRIES = 2;

    function getFaviconUrl(domain: string, retryCount: number, size = 48): string {
        if (retryCount > MAX_RETRIES) return "";
        if (!domain || domain.length <= 5) return "";

        if (retryCount === 0) {
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
        } else if (retryCount === 1) {
            return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        } else {
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        }
    }

    return {
        MAX_RETRIES,
        getFaviconUrl
    };
}
