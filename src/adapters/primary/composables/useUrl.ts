/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";
import {computed} from "vue";

import {UrlUtils} from "@/domain/utils/url";
import {log} from "@/domain/utils/utils";

/**
 * Composable that derives URL parts (domain, subdomain, protocol, pathname)
 * reactively from a bound `Ref<string>`.
 *
 * @param url - Reactive URL string to parse.
 * @returns Computed getters for `domain`, `subdomain`, `protocol`, `pathname`.
 * @module composables/useUrl
 */
export function useUrl(url: Ref<string>) {
    /**
     * Hostname without the `www.` prefix (e.g., `example.com`).
     */
    const domain = computed(() => UrlUtils.getDomain(url.value));

    /**
     * The first label of the hostname when present and not `www` (e.g., `app`).
     * Returns `null` when no subdomain exists.
     */
    const subdomain = computed(() => UrlUtils.getSubdomain(url.value));

    /**
     * The URL protocol without trailing colon (e.g., `https`).
     */
    const protocol = computed(() => UrlUtils.getProtocol(url.value));

    /**
     * The path portion of the URL beginning with `/` (e.g., `/docs`).
     */
    const pathname = computed(() => UrlUtils.getPathname(url.value));

    return {
        domain,
        subdomain,
        protocol,
        pathname
    };
}

log("COMPOSABLES useUrl");