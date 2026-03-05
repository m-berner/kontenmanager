/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Service that provides favicon URLs with fallback providers.
 *
 * Providers chain:
 * 1. Google S2 favicons (requested size)
 * 2. DuckDuckGo IP3 `.ico`
 * 3. Google S2 16px as the final fallback
 */
export const FaviconService = {
    MAX_RETRIES: 2,

    /**
     * The best-effort favicon URL based on the current retry stage.
     * @param domain - The domain name to fetch the icon for.
     * @param retryCount - Current retry attempt (0-2).
     * @param size - Preferred favicon size in pixels (default: 48).
     * @returns Favicon URL or empty string if domain is invalid.
     */
    getFaviconUrl(domain: string, retryCount: number, size = 48): string {
        if (!domain || domain.length <= 5) return "";

        if (retryCount === 0) {
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
        } else if (retryCount === 1) {
            return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        } else {
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        }
    }
};
