/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {computed, ref} from "vue";

const getFaviconUrl = vi.fn((domain: string, retryCount: number) => `provider-${retryCount}://${domain}`);

vi.mock("@/adapters/context", () => ({
    useAdapters: () => ({
        faviconAdapter: {MAX_RETRIES: 2, getFaviconUrl}
    })
}));

import {useFavicon} from "@/adapters/ui/composables/useFavicon";

describe("useFavicon", () => {
    it("starts loading, with no error, at retry stage 0", () => {
        const domain = computed(() => "example.com");
        const {faviconUrl, loading, error} = useFavicon(domain);

        expect(loading.value).toBe(true);
        expect(error.value).toBe(false);
        expect(faviconUrl.value).toBe("provider-0://example.com");
    });

    it("onLoad clears loading and error state", () => {
        const domain = computed(() => "example.com");
        const {loading, error, onLoad} = useFavicon(domain);

        onLoad();

        expect(loading.value).toBe(false);
        expect(error.value).toBe(false);
    });

    it("onError advances to the next provider while retries remain", () => {
        const domain = computed(() => "example.com");
        const {faviconUrl, loading, error, onError} = useFavicon(domain);

        onError();

        expect(loading.value).toBe(true);
        expect(error.value).toBe(false);
        expect(faviconUrl.value).toBe("provider-1://example.com");
    });

    it("onError sets a terminal error state once MAX_RETRIES is exceeded", () => {
        const domain = computed(() => "example.com");
        const {loading, error, onError} = useFavicon(domain);

        onError(); // retryCount 0 -> 1
        onError(); // retryCount 1 -> 2
        onError(); // retryCount 2 -> stays at 2, MAX_RETRIES reached

        expect(error.value).toBe(true);
        expect(loading.value).toBe(false);
    });

    it("reset() returns to the initial provider and clears error state", () => {
        const domain = computed(() => "example.com");
        const {faviconUrl, error, onError, reset} = useFavicon(domain);

        onError();
        onError();
        onError();
        expect(error.value).toBe(true);

        reset();

        expect(error.value).toBe(false);
        expect(faviconUrl.value).toBe("provider-0://example.com");
    });

    it("reacts to a changing domain ref", () => {
        const url = ref("first.com");
        const domain = computed(() => url.value);
        const {faviconUrl} = useFavicon(domain);

        expect(faviconUrl.value).toBe("provider-0://first.com");
        url.value = "second.com";
        expect(faviconUrl.value).toBe("provider-0://second.com");
    });
});