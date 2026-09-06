/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export type FaviconAdapter = ReturnType<typeof createFaviconAdapter>;

/**
 * Service that provides favicon URLs with fallback providers.
 *
 * Provider chain:
 * 1. Google S2 favicons (requested size)
 * 2. DuckDuckGo IP3 `.ico`
 * 3. Google S2 16px as the final fallback
 */
export function createFaviconAdapter() {
    const MAX_RETRIES = 2;

    // One or more dot-separated labels ending in a TLD of at least two
    // characters, with no whitespace.
    //
    // Replaces a `domain.length <= 5` floor, which rejected real registrable
    // domains: "vw.de", "bp.de", "gm.de" and "x.com" are all exactly five
    // characters, and the account form's logo lookup is one of the few places a
    // user would type one.
    //
    // The two-character TLD minimum is what the length floor was really
    // reaching for: no single-character TLD exists in the DNS root, so "abc.d"
    // is still rejected. A single-character *label* is fine, though — "a.co"
    // and "x.com" are both registrable — so shape, not total length, is the
    // right test.
    const DOMAIN_SHAPE = /^[^\s.]+(\.[^\s.]+)*\.[^\s.]{2,}$/;

    function getFaviconUrl(domain: string, retryCount: number, size = 48): string {
        if (retryCount > MAX_RETRIES) return "";
        if (!domain || !DOMAIN_SHAPE.test(domain)) return "";

        // Percent-encoded before interpolation. `domain` traces back to user
        // input (`account.cLogoUrl` -> `UrlUtils.getDomain()` -> `useUrl` ->
        // `useFavicon`), and neither filter in front of it excludes `&`:
        // `new URL(...).hostname` rejects only the WHATWG forbidden host code
        // points, and `DOMAIN_SHAPE` above excludes whitespace and dots inside
        // labels. So `https://a&b.com` yielded hostname `a&b.com` and produced
        // `…?domain=a&b.com&sz=48`, where the `&` terminates the `domain`
        // parameter and injects `b.com` as a separate one.
        //
        // The stakes are small — an unauthenticated favicon lookup, so the worst
        // outcome is a wrong or default icon, with no credential and no
        // same-origin data involved — but this is unencoded user data in a URL,
        // and encoding it is the whole fix.
        const encodedDomain = encodeURIComponent(domain);

        if (retryCount === 0) {
            return `https://www.google.com/s2/favicons?domain=${encodedDomain}&sz=${size}`;
        } else if (retryCount === 1) {
            return `https://icons.duckduckgo.com/ip3/${encodedDomain}.ico`;
        } else {
            return `https://www.google.com/s2/favicons?domain=${encodedDomain}&sz=16`;
        }
    }

    return {
        MAX_RETRIES,
        getFaviconUrl
    };
}
