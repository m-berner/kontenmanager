/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {FaviconService} from "./faviconService";

describe("FaviconService", () => {
    const domain = "example.com";

    it("should return Google S2 URL for retryCount 0", () => {
        const url = FaviconService.getFaviconUrl(domain, 0, 48);
        expect(url).toContain("google.com/s2/favicons");
        expect(url).toContain("domain=example.com");
        expect(url).toContain("sz=48");
    });

    it("should return DuckDuckGo URL for retryCount 1", () => {
        const url = FaviconService.getFaviconUrl(domain, 1);
        expect(url).toBe("https://icons.duckduckgo.com/ip3/example.com.ico");
    });

    it("should return Google S2 16px URL for retryCount 2", () => {
        const url = FaviconService.getFaviconUrl(domain, 2);
        expect(url).toContain("google.com/s2/favicons");
        expect(url).toContain("sz=16");
    });

    it("should return empty string for short domains", () => {
        expect(FaviconService.getFaviconUrl("abc.d", 0)).toBe("");
        expect(FaviconService.getFaviconUrl("a.bc", 0)).toBe("");
    });

    it("should return empty string for empty domain", () => {
        expect(FaviconService.getFaviconUrl("", 0)).toBe("");
    });
});
