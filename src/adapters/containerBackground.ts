/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createBrowserAdapter} from "@/adapters/secondary/browserAdapter";
import {storageAdapter} from "@/adapters/secondary/storageAdapter";

/** Inferred type of the background service container. */
export type BackgroundAdapters = ReturnType<typeof createBackgroundAdapters>;

/** Dependency overrides for testing — replace any service with a test double. */
export type BackgroundAdaptersOverrides = Partial<{
    browserAdapter: ReturnType<typeof createBrowserAdapter>;
    storageAdapter: typeof storageAdapter;
}>;

/**
 * Background entrypoint container.
 * Keep this minimal to avoid pulling UI- and app-layer services into the background bundle.
 *
 * @param overrides - Optional service overrides, used in tests.
 */
export function createBackgroundAdapters(overrides: BackgroundAdaptersOverrides = {}) {
    const browserAdapter = overrides.browserAdapter ?? createBrowserAdapter();
    const storage = overrides.storageAdapter ?? storageAdapter;

    return {
        browserAdapter,
        storageAdapter: storage
    };
}
