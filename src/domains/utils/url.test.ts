/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {UrlUtils} from "./url";

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
