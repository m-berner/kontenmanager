/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Cache policy defaults used across layers.
 *
 * Note: there are multiple cache layers:
 * - fetch-service HTTP response caching (per URL/provider)
 * - UI "page freshness" caching (to avoid reloading the same table page too often)
 */
export const CACHE_POLICY = {
    /** Default TTL for generic HTTP cache entries (non-quote endpoints). */
    DEFAULT_HTTP_TTL_MS: 5 * 60 * 1000,
    /** Max age for stock quote HTTP cache entries (min/rate/max). */
    QUOTE_TTL_MS: 60_000,
    /** Max age for considering a CompanyContent stocks page "fresh" without reloading online data. */
    ONLINE_RATES_MAX_AGE_MS: 60_000
} as const;

