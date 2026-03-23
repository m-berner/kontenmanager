/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createPinia, setActivePinia} from "pinia";
import {vi} from "vitest";
import {attachStoreDeps} from "@/adapters/primary/stores/deps";

/**
 * Creates a Pinia instance, attaches default store deps, and makes it active.
 * Individual tests can override deps by calling attachStoreDeps(pinia, ...) again.
 */
export function setActiveTestPinia() {
    const pinia = createPinia();

    attachStoreDeps(pinia, {
        storageAdapter: () => ({
            clearStorage: vi.fn().mockResolvedValue(undefined),
            getStorage: vi.fn().mockResolvedValue({}),
            setStorage: vi.fn().mockResolvedValue(undefined),
            addStorageChangedListener: vi.fn(() => vi.fn()),
            installStorageLocal: vi.fn().mockResolvedValue(undefined)
        }),
        alertAdapter: {
            feedbackInfo: vi.fn(),
            feedbackWarning: vi.fn(),
            feedbackConfirm: vi.fn(),
            feedbackError: vi.fn()
        }
    });

    setActivePinia(pinia);
    return pinia;
}
