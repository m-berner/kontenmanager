/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";
import {computed} from "vue";
import {DomainUtils} from "@/domains/utils";
import {serializeError} from "@/domains/errors";

/**
 * Composable that derives URL parts (domain, subdomain, protocol, pathname)
 * reactively from a bound `Ref<string>`.
 *
 * Accepts values with and without protocol, normalizing inputs like
 * `example.com` to `https://example.com` for parsing.
 *
 * @param url - Reactive URL string to parse.
 * @returns Computed getters for `domain`, `subdomain`, `protocol`, `pathname`.
 * @module composables/useDomain
 */
export function useDomain(url: Ref<string>) {
    /**
     * Hostname without the `www.` prefix (e.g., `example.com`).
     */
    const domain = computed(() => {
        if (!url.value) return "";
        try {
            let processedUrl = url.value;
            if (!processedUrl.startsWith("http")) {
                processedUrl = `https://${processedUrl}`;
            }
            const urlObj = new URL(processedUrl);
            return urlObj.hostname.replace(/^www\./, "");
        } catch (e) {
            DomainUtils.log("COMPOSABLES useDomain: domain", serializeError(e), "error");
            return "";
        }
    });

    /**
     * The first label of the hostname when present and not `www` (e.g., `app`).
     * Returns `null` when no subdomain exists.
     */
    const subdomain = computed(() => {
        if (!url.value) return null;
        try {
            const urlObj = new URL(
                url.value.startsWith("http") ? url.value : `https://${url.value}`
            );
            const parts = urlObj.hostname.split(".");
            if (parts.length > 2) {
                return parts[0] !== "www" ? parts[0] : null;
            }
            return null;
        } catch (e) {
            DomainUtils.log("COMPOSABLES useDomain: subdomain", serializeError(e), "error");
            return null;
        }
    });

    /**
     * The URL protocol without trailing colon (e.g., `https`).
     */
    const protocol = computed(() => {
        if (!url.value) return null;

        try {
            const urlObj = new URL(
                url.value.startsWith("http") ? url.value : `https://${url.value}`
            );
            return urlObj.protocol.replace(":", "");
        } catch (e) {
            DomainUtils.log("COMPOSABLES useDomain: protocol", serializeError(e), "error");
            return null;
        }
    });

    /**
     * The path portion of the URL beginning with `/` (e.g., `/docs`).
     */
    const pathname = computed(() => {
        if (!url.value) return null;

        try {
            const urlObj = new URL(
                url.value.startsWith("http") ? url.value : `https://${url.value}`
            );
            return urlObj.pathname;
        } catch (e) {
            DomainUtils.log("COMPOSABLES useDomain: pathname", serializeError(e), "error");
            return null;
        }
    });

    return {
        domain,
        subdomain,
        protocol,
        pathname
    };
}

DomainUtils.log("COMPOSABLES useDomain");
