/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {createFaviconAdapter} from "@/adapters/secondary/faviconAdapter";

describe("faviconAdapter", () => {
    const faviconAdapter = createFaviconAdapter();
    const domain = "example.com";

    it("should return Google S2 URL for retryCount 0", () => {
        const url = faviconAdapter.getFaviconUrl(domain, 0, 48);
        expect(url).toContain("google.com/s2/favicons");
        expect(url).toContain("domain=example.com");
        expect(url).toContain("sz=48");
    });

    it("should return DuckDuckGo URL for retryCount 1", () => {
        const url = faviconAdapter.getFaviconUrl(domain, 1);
        expect(url).toBe("https://icons.duckduckgo.com/ip3/example.com.ico");
    });

    it("should return Google S2 16px URL for retryCount 2", () => {
        const url = faviconAdapter.getFaviconUrl(domain, 2);
        expect(url).toContain("google.com/s2/favicons");
        expect(url).toContain("sz=16");
    });

    it("should return an empty string for retryCount 3", () => {
        expect(faviconAdapter.getFaviconUrl(domain, 3)).toBe("");
    });

    it("should return an empty string for short domains", () => {
        expect(faviconAdapter.getFaviconUrl("abc.d", 0)).toBe("");
        expect(faviconAdapter.getFaviconUrl("a.bc", 0)).toBe("");
    });

    it("should return an empty string for an empty domain", () => {
        expect(faviconAdapter.getFaviconUrl("", 0)).toBe("");
    });
});
