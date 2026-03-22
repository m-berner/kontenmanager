/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";

const DEFAULT_TTL = CACHE_POLICY.DEFAULT_HTTP_TTL_MS;

/**
 * Simple in-memory cache with TTL (time-to-live) expiration.
 * Automatically cleans up expired entries when the cache exceeds 100 items.
 * Used primarily for caching HTTP responses to reduce network requests.
 */
const cache = new Map<string, { data: string; timestamp: number }>();

/** Removes all entries from the cache. */
export function clearCache(): void {
    cache.clear();
}

/**
 * Returns the cached value for `key` if it exists and has not yet expired.
 * Deletes the entry and returns `null` when it is stale.
 *
 * @param key - Cache key to look up.
 * @param ttl - Maximum age in milliseconds before the entry is considered stale.
 */
export function getCache(key: string, ttl: number = DEFAULT_TTL): string | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

/** Returns the current number of cached entries and their keys — useful for diagnostics. */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys())
    };
}

/**
 * Stores `data` under `key`, recording the current timestamp.
 * Triggers a cleanup pass when the cache grows beyond 100 entries.
 *
 * @param key - Cache key.
 * @param data - String value to cache (typically serialized HTML).
 */
export function setCache(key: string, data: string): void {
    cache.set(key, {data, timestamp: Date.now()});
    if (cache.size > 100) cleanupCache();
}

/**
 * Removes all entries whose age exceeds `DEFAULT_TTL`.
 * Called automatically by `setCache` when the cache exceeds 100 items.
 */
function cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > DEFAULT_TTL) {
            cache.delete(key);
        }
    }
}