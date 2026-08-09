/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {sanitizeExternalUrl, UrlUtils} from "@/domain/utils/url";

describe("UrlUtils", () => {
    describe("getDomain", () => {
        it("should extract domain from full URL", () => {
            expect(UrlUtils.getDomain("https://www.example.com/path")).toBe("example.com");
        });

        it("should extract domain from URL without protocol", () => {
            expect(UrlUtils.getDomain("example.com")).toBe("example.com");
        });

        it("should remove the www prefix", () => {
            expect(UrlUtils.getDomain("www.test.de")).toBe("test.de");
        });

        it("should handle subdomains (keep them in domain if not www)", () => {
            expect(UrlUtils.getDomain("app.example.com")).toBe("app.example.com");
        });
    });

    describe("getSubdomain", () => {
        it("should extract subdomain", () => {
            expect(UrlUtils.getSubdomain("https://app.example.com")).toBe("app");
        });

        it("should return null if no subdomain", () => {
            expect(UrlUtils.getSubdomain("https://example.com")).toBe(null);
        });

        it("should return null if the subdomain is www", () => {
            expect(UrlUtils.getSubdomain("https://www.example.com")).toBe(null);
        });

        it("should return null for a bare two-part-TLD domain with no subdomain", () => {
            expect(UrlUtils.getSubdomain("https://example.co.uk")).toBe(null);
            expect(UrlUtils.getSubdomain("https://example.com.au")).toBe(null);
        });

        it("should extract the subdomain of a two-part-TLD domain", () => {
            expect(UrlUtils.getSubdomain("https://sub.example.co.uk")).toBe("sub");
        });
    });

    describe("getProtocol", () => {
        it("should extract protocol", () => {
            expect(UrlUtils.getProtocol("http://example.com")).toBe("http");
            expect(UrlUtils.getProtocol("https://example.com")).toBe("https");
        });

        it("should default to https if missing", () => {
            expect(UrlUtils.getProtocol("example.com")).toBe("https");
        });
    });

    describe("getPathname", () => {
        it("should extract the pathname", () => {
            expect(UrlUtils.getPathname("https://example.com/test/path")).toBe("/test/path");
        });

        it("should return / for root", () => {
            expect(UrlUtils.getPathname("https://example.com")).toBe("/");
        });
    });
});

describe("sanitizeExternalUrl", () => {
    it("accepts http(s) URLs and returns them normalized", () => {
        expect(sanitizeExternalUrl("https://example.com/path")).toBe("https://example.com/path");
        expect(sanitizeExternalUrl("http://example.com")).toBe("http://example.com/");
    });

    // A stock URL saved before `urlRules` existed — the field had no `:rules`
    // binding at all then — is very likely scheme-less. Rejecting it made
    // `useMenu.openLink` report "no link" for a perfectly good address, and
    // blocked re-saving the stock with an "invalid URL" message that did not say
    // what was missing.
    it("assumes https for a scheme-less host", () => {
        expect(sanitizeExternalUrl("www.example.com")).toBe("https://www.example.com/");
        expect(sanitizeExternalUrl("  example.com/quotes  ")).toBe("https://example.com/quotes");
    });

    // The prepend above must key on "has no scheme", NOT on "does not start with
    // http" — the latter is what `UrlUtils.parseUrl` does, and applying it here
    // would rewrite `javascript:alert(1)` into a valid https URL and defeat the
    // allowlist entirely.
    it("still rejects a dangerous scheme rather than prepending https to it", () => {
        expect(sanitizeExternalUrl("javascript:alert(1)")).toBeNull();
        expect(sanitizeExternalUrl("data:text/html,<script>x</script>")).toBeNull();
        expect(sanitizeExternalUrl("file:///etc/passwd")).toBeNull();
        expect(sanitizeExternalUrl("blob:https://example.com/abc")).toBeNull();
    });

    it("rejects embedded credentials and blank input", () => {
        expect(sanitizeExternalUrl("https://user:pw@example.com")).toBeNull();
        expect(sanitizeExternalUrl("")).toBeNull();
        expect(sanitizeExternalUrl("   ")).toBeNull();
        expect(sanitizeExternalUrl(null)).toBeNull();
        expect(sanitizeExternalUrl(undefined)).toBeNull();
    });
});
