/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {serializeError} from "@/domain/errors";
import {log} from "@/domain/utils/utils";

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

            // Handle common two-part TLDs like .co.uk, .com.au, etc. Checked
            // regardless of total part count so a bare `example.co.uk` (3
            // parts, no subdomain) is recognized too, not just `sub.example.co.uk`.
            const isTwoPartTld = parts.length >= 3 && (
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

/**
 * Fail-closed validator for a URL that arrives from the user or from a backup,
 * and will later reach a navigation or resource sink.
 *
 * Returns the normalized absolute URL when it is safe to use, `null` otherwise.
 * `null` rather than a best guess is the whole point: a caller that gets
 * `null` must not navigate.
 *
 * **Why this exists.** Two URL fields are stored as arbitrary strings and no
 * layer checked either of them:
 *
 * - `StockDb.cURL` — the stock form's URL field carried no `:rules` binding at
 *   all (the only field in that form without rules), `mapStockFormToDb` only
 *   trims it, `validateStock` only `normalizeString`s it, and
 *   `useMenu.openLink` handed it straight to `window.open`. So `javascript:`,
 *   `data:` and `file:` URLs were accepted, persisted and later opened.
 * - `AccountDb.cLogoUrl` — safe through the UI (the field has no text input;
 *   `AccountForm` writes it only from `faviconAdapter`'s constructed URLs) but
 *   not through import, where a backup can set it to anything and `TitleBar`
 *   renders it as an `<img src>` on every app load for the active account.
 *
 * On impact, stated honestly: `window.open`'s `noopener` means the new context
 * gets no reference back, and current browsers largely neutralize top-level
 * `javascript:` navigations opened that way — this is not a claim of script
 * execution in the extension origin. `<img>` executes nothing at all, and does
 * not run scripts inside an SVG it loads. What is certain is that an
 * externally-supplied scheme reached a navigation sink in an extension page,
 * and that opening a shared backup issued an automatic request to a host of the
 * sharer's choosing — a load-time signal that the file was opened, from the
 * extension's own context. Neither depends on anything in this codebase for
 * mitigation, which is the part worth removing.
 *
 * **The repo already contains the model, three times.** Every provider that
 * consumes a URL from an untrusted document validates it fail-closed:
 * `sanitizeArdDetailUrlFromOnclick` (`fetch/providers/ard.ts`),
 * `buildWStreetDetailUrl` (`wstreet.ts`) and `resolveAcheckRedirect`
 * (`acheck.ts`) — the last stating outright that it is "matching how ard.ts and
 * wstreet.ts treat scraped navigation targets". So this was not an absent
 * capability but an established convention applied wherever a URL arrives from
 * *scraped* input and nowhere on the two that arrive from *user or backup*
 * input. `ard`'s is the fullest, and this follows it minus the host allowlist
 * and path prefix, which do not apply: any host is legitimate for a user's own
 * link.
 *
 * Note `UrlUtils.parseUrl` above is deliberately **not** used here — it
 * prepends `https://` whenever the string does not start with `http`, which
 * would mask exactly the schemes this rejects.
 *
 * @param raw - The stored URL string.
 * @returns The normalized URL, or `null` when it must not be used.
 */
export function sanitizeExternalUrl(raw: string | undefined | null): string | null {
    const trimmed = (raw ?? "").trim();
    if (trimmed === "") return null;

    try {
        const url = new URL(trimmed);

        // Scheme allowlist, not a denylist: enumerating the dangerous schemes
        // (`javascript:`, `data:`, `file:`, `blob:`, …) means the next one
        // invented is allowed by default.
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;

        // Embedded credentials are never wanted here and are a classic way to
        // make a hostile host look like a familiar one in a status bar.
        if (url.username !== "" || url.password !== "") return null;

        return url.toString();
    } catch (e) {
        log("DOMAINS UrlUtils: sanitizeExternalUrl", serializeError(e), "warn");
        return null;
    }
}
