/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createBrowserAdapter} from "@/adapters/secondary/browserAdapter";
import {storageAdapter} from "@/adapters/secondary/storageAdapter";

/** Inferred type of the background service container. */
export type BackgroundServices = ReturnType<typeof createBackgroundServices>;

/** Dependency overrides for testing — replace any service with a test double. */
export type BackgroundServicesOverrides = Partial<{
    browserService: ReturnType<typeof createBrowserAdapter>;
    storageAdapter: typeof storageAdapter;
}>;

/**
 * Background entrypoint container.
 * Keep this minimal to avoid pulling UI- and app-layer services into the background bundle.
 *
 * @param overrides - Optional service overrides, used in tests.
 */
export function createBackgroundServices(overrides: BackgroundServicesOverrides = {}) {
    const browserService = overrides.browserService ?? createBrowserAdapter();
    const storage = overrides.storageAdapter ?? storageAdapter;

    return {
        browserService,
        storageAdapter: storage
    };
}
