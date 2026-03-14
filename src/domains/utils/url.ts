/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {log} from "@/domains/utils/utils";
import {serializeError} from "@/domains/errors";

/**
 * Utility for parsing and normalizing URLs.
 * This is pure logic independent of Vue's reactivity.
 */
export const UrlUtils = {
    /**
     * Extracts the hostname without the `www.` prefix (e.g., `example.com`).
     * @param url - URL string to parse.
     */
    getDomain(url: string): string {
        if (!url) return "";
        try {
            const urlObj = this.parseUrl(url);
            return urlObj.hostname.replace(/^www\./, "");
        } catch (e) {
            log("DOMAINS UrlUtils: getDomain", serializeError(e), "error");
            return "";
        }
    },

    /**
     * Extracts the first label of the hostname when present and not `www` (e.g., `app`).
     * Returns `null` when no subdomain exists.
     * @param url - URL string to parse.
     */
    getSubdomain(url: string): string | null {
        if (!url) return null;
        try {
            const urlObj = this.parseUrl(url);
            const hostname = urlObj.hostname;
            // Simple heuristic for subdomain:
            // 1. If the hostname is IP, no subdomain
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) return null;

            const parts = hostname.split(".");
            if (parts.length <= 2) return null;

            // Handle common two-part TLDs like .co.uk, .com.au, etc.
            const isTwoPartTld = parts.length > 3 && (
                (parts[parts.length - 2] === "co" && parts[parts.length - 1] === "uk") ||
                (parts[parts.length - 2] === "com" && parts[parts.length - 1] === "au")
            );

            const minPartsForSubdomain = isTwoPartTld ? 4 : 3;

            if (parts.length >= minPartsForSubdomain) {
                return parts[0] !== "www" ? parts[0] : null;
            }
            return null;
        } catch (e) {
            log("DOMAINS UrlUtils: getSubdomain", serializeError(e), "error");
            return null;
        }
    },

    /**
     * Extracts the URL protocol without trailing colon (e.g., `https`).
     * @param url - URL string to parse.
     */
    getProtocol(url: string): string | null {
        if (!url) return null;
        try {
            const urlObj = this.parseUrl(url);
            return urlObj.protocol.replace(":", "");
        } catch (e) {
            log("DOMAINS UrlUtils: getProtocol", serializeError(e), "error");
            return null;
        }
    },

    /**
     * Extracts the path portion of the URL beginning with `/` (e.g., `/docs`).
     * @param url - URL string to parse.
     */
    getPathname(url: string): string | null {
        if (!url) return null;
        try {
            const urlObj = this.parseUrl(url);
            return urlObj.pathname;
        } catch (e) {
            log("DOMAINS UrlUtils: getPathname", serializeError(e), "error");
            return null;
        }
    },

    /**
     * Internal helper to parse a URL string, ensuring it has a protocol.
     * @param url - URL string to parse.
     */
    parseUrl(url: string): URL {
        let processedUrl = url;
        if (!processedUrl.startsWith("http")) {
            processedUrl = `https://${processedUrl}`;
        }
        return new URL(processedUrl);
    }
};
