/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY, ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import {log} from "@/domain/utils/utils";

import {getCache, setCache} from "@/adapters/secondary/fetch/httpCache";

/** Resolves after `ms` milliseconds — used for exponential backoff between retries. */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a fetch request with automatic retries on failure.
 * Includes 30-second timeout and exponential backoff between attempts.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch configuration
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Response object from successful fetch
 * @throws {@link AppError} When all retry attempts fail
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3
): Promise<Response> {
    const controller = new AbortController();
    const TIMEOUT_MS = 30_000;
    const timeoutReason = appError(
        ERROR_DEFINITIONS.SERVICES.FETCH.A.CODE,
        ERROR_CATEGORY.NETWORK,
        true,
        {url, timeoutMs: TIMEOUT_MS, reason: "timeout"}
    );
    const timeoutId = setTimeout(() => controller.abort(timeoutReason), TIMEOUT_MS);
    let lastStatus: number | undefined;
    let lastError: unknown;

    // Always enforce our own timeout, but still respect any caller-provided abort signal.
    // We do this by always passing our controller.signal to fetch, and mirroring the
    // caller abort into it.
    const callerSignal = options.signal;
    const onCallerAbort = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) {
        controller.abort(callerSignal.reason);
    } else {
        callerSignal?.addEventListener("abort", onCallerAbort, {once: true});
    }

    try {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Do not pass the caller signal directly, otherwise the timeout abort above
                // would be bypassed when a caller supplies its own signal.
                const {signal: _ignoredSignal, ...restOptions} = options;
                const response = await fetch(url, {
                    ...restOptions,
                    signal: controller.signal
                });

                if (response.ok) {
                    return response;
                }

                lastStatus = response.status;
                // Only retry on rate-limit (429) or server errors (5xx); client errors are final.
                const isRetryable = response.status === 429 || response.status >= 500;

                if (!isRetryable || attempt === maxRetries) {
                    break;
                }
            } catch (error) {
                // Prefer a structured abort reason (e.g. timeout AppError) if available.
                lastError =
                    controller.signal.aborted && controller.signal.reason !== undefined
                        ? controller.signal.reason
                        : error;

                // Caller cancellation should stop immediately (no retries).
                if (controller.signal.aborted && controller.signal.reason !== timeoutReason) {
                    throw lastError;
                }

                if (attempt < maxRetries) {
                    await delay(1000 * attempt); // 1 s, 2 s, … per attempt
                }
            }
        }
    } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", onCallerAbort);
    }

    throw appError(ERROR_DEFINITIONS.SERVICES.FETCH.A.CODE, ERROR_CATEGORY.NETWORK, true, {
        url,
        maxRetries,
        lastStatus,
        lastError: serializeError(lastError)
    });
}

/**
 * Fetches text content with automatic caching.
 * Returns cached content if available and not expired.
 *
 * @param url - URL to fetch; also used as the cache key
 * @param ttl - Cache time-to-live in milliseconds (default: 5 minutes)
 * @param options - Fetch options forwarded to the underlying HTTP call
 * @returns Cached or freshly fetched text content
 */
export async function fetchWithCache(
    url: string,
    ttl = CACHE_POLICY.DEFAULT_HTTP_TTL_MS,
    options: RequestInit = {}
): Promise<string> {
    const cached = getCache(url, ttl);
    if (cached) {
        log(`SERVICES fetch: Cache hit for ${url}`);
        return cached;
    }

    log(`SERVICES fetch: Cache miss for ${url}, fetching...`);
    const response = await fetchWithRetry(url, options);
    const text = await response.text();

    setCache(url, text);
    return text;
}

/**
 * Fetches text content while following redirects to the canonical URL.
 * Caches the returned HTML under both the original URL and the final (redirected) URL
 * so subsequent lookups under either key hit the cache.
 *
 * @param url - URL to fetch
 * @param ttl - Cache time-to-live in milliseconds (default: 5 minutes)
 * @param options - Fetch options forwarded to the underlying HTTP call
 * @returns Fetched text content
 */
export async function fetchTextWithCacheFollowRedirect(
    url: string,
    ttl = CACHE_POLICY.DEFAULT_HTTP_TTL_MS,
    options: RequestInit = {}
): Promise<string> {
    const cached = getCache(url, ttl);
    if (cached) {
        log(`SERVICES fetch: Cache hit for ${url}`);
        return cached;
    }

    log(`SERVICES fetch: Cache miss for ${url}, fetching (follow redirect)...`);
    const response = await fetchWithRetry(url, options);
    const text = await response.text();

    // Cache under the canonical/final URL; also store an alias under the original
    // URL so callers that always pass the same URL still get a cache hit.
    const finalUrl = response.url || url;
    setCache(finalUrl, text);
    if (finalUrl !== url) {
        setCache(url, text);
    }
    return text;
}

/**
 * Parses HTML string into a Document object for DOM manipulation.
 *
 * @param text - HTML content as string
 * @returns Parsed Document object
 * @throws {@link AppError} When text is empty or invalid
 */
export async function parseHTML(text: string): Promise<Document> {
    if (!text) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    return new DOMParser().parseFromString(text, "text/html");
}