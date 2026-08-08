/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
    attachStoreTranslate,
    getStoreTranslate,
    resetStoreTranslateWarningForTests
} from "@/adapters/ui/stores/deps";
import {setActiveTestPinia} from "@test/pinia";

describe("stores/deps store-translate side channel", () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        resetStoreTranslateWarningForTests();
        // `log()` is silent unless MODE is "development" or VITE_DEBUG_LOGS is
        // set. Vitest runs with MODE "test", so the flag has to be stubbed for
        // the warning to be observable at all — which is also the point of the
        // finding: this costs release builds nothing.
        vi.stubEnv("VITE_DEBUG_LOGS", "true");
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        // Restore, not just clear: vi.spyOn in beforeEach otherwise nests a new
        // spy over the previous one on each test.
        warn.mockRestore();
        vi.unstubAllEnvs();
    });

    it("returns the attached translate function", () => {
        const pinia = setActiveTestPinia();
        const translate = vi.fn().mockReturnValue("übersetzt");
        attachStoreTranslate(pinia, translate);

        expect(getStoreTranslate()?.("stores.settings.errorTitle")).toBe("übersetzt");
        expect(warn).not.toHaveBeenCalled();
    });

    // Every consumer falls back to a hardcoded English string when this is
    // undefined, and those fallbacks read plausibly ("Settings error",
    // "Confirm", "Cancel") — so a missing attachStoreTranslate in a new
    // entrypoint looked exactly like a working app in English rather than a
    // wiring bug, and nothing ever said otherwise.
    it("warns when nothing was attached", () => {
        setActiveTestPinia();

        expect(getStoreTranslate()).toBeUndefined();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0]?.[0] ?? "")).toContain("attachStoreTranslate");
    });

    it("warns only once, however many times it is asked", () => {
        // settings.errorTitle and alerts.defaultConfirmText/defaultCancelText
        // each call this on every access, so an unguarded warning would fire on
        // every alert rather than pointing at a wiring omission.
        setActiveTestPinia();

        getStoreTranslate();
        getStoreTranslate();
        getStoreTranslate();

        expect(warn).toHaveBeenCalledTimes(1);
    });

    it("does not throw or change the fallback contract", () => {
        // Deliberately not a throw: an untranslated confirm button beats a
        // store that cannot render an alert at all.
        setActiveTestPinia();

        expect(() => getStoreTranslate()).not.toThrow();
        expect(getStoreTranslate()).toBeUndefined();
    });
});
