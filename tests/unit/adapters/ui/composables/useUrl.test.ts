/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {ref} from "vue";
import {useUrl} from "@/adapters/ui/composables/useUrl";

describe("useUrl", () => {
    it("derives domain, protocol, and pathname from a full URL", () => {
        const url = ref("https://www.example.com/docs/page");
        const {domain, protocol, pathname} = useUrl(url);

        expect(domain.value).toBe("example.com");
        expect(protocol.value).toBe("https");
        expect(pathname.value).toBe("/docs/page");
    });

    it("derives a subdomain when one is present and it is not 'www'", () => {
        const url = ref("https://app.example.com");
        const {subdomain} = useUrl(url);

        expect(subdomain.value).toBe("app");
    });

    it("reacts to changes in the underlying ref", () => {
        const url = ref("https://example.com");
        const {domain} = useUrl(url);
        expect(domain.value).toBe("example.com");

        url.value = "https://other.org";
        expect(domain.value).toBe("other.org");
    });
});