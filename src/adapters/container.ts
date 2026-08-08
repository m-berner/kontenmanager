/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryMap} from "@/domain/types";

import type {AlertAdapter} from "@/adapters/driven/alertAdapter";
import {createAlertAdapter} from "@/adapters/driven/alertAdapter";
import {createAppAdapter} from "@/adapters/driven/appAdapter";
import {createBrowserAdapter} from "@/adapters/driven/browserAdapter";
import {createDatabaseAdapter} from "@/adapters/driven/database/databaseAdapter";
import {createFaviconAdapter} from "@/adapters/driven/faviconAdapter";
import {createFetchAdapter} from "@/adapters/driven/fetchAdapter";
import {createImportExportAdapter} from "@/adapters/driven/importExportAdapter";
import {storageAdapter} from "@/adapters/driven/storageAdapter";
import {createTaskAdapter} from "@/adapters/driven/taskAdapter";
import {createValidationAdapter} from "@/adapters/ui/validationAdapter";

/**
 * The container as constructed, including infrastructure-only surface.
 *
 * Only the bootstrap holds this: `app.ts`/`options.ts` build it and hand it to
 * `createAppPinia`, which needs `alertAdapter.configureAlertSink`. Everything
 * that goes through DI sees {@link Adapters} instead.
 */
export type AdaptersInternal = ReturnType<typeof createAdapters>;

/**
 * The DI surface — what `useAdapters()` returns, and therefore what every
 * component, composable and store can reach.
 *
 * `alertAdapter` is narrowed to `AlertAdapter`, the deliberately reduced type
 * `alertAdapter.ts` defines with the note that `configureAlertSink` "is an
 * infrastructure-level setup concern and must not be callable from UI code".
 * That narrowing existed and was applied only where dependencies are declared
 * by hand (`useDialogGuards`' deps type, `useExportDialog`'s `services`), while
 * the path almost every consumer actually uses — `useAdapters()` — exposed the
 * full factory return. `useAdapters().alertAdapter.configureAlertSink(undefined)`
 * type-checked inside any component and would have silently disabled every
 * alert in the app for the rest of the session.
 */
export type Adapters = Omit<AdaptersInternal, "alertAdapter"> & {
    alertAdapter: AlertAdapter;
};

/**
 * Creates the runtime adapter container for a single extension context
 * (app/options/background). Consumers should access adapters via DI.
 */
export type AdaptersOverrides = Partial<{
    browserAdapter: ReturnType<typeof createBrowserAdapter>;
    alertAdapter: ReturnType<typeof createAlertAdapter>;
    databaseAdapter: ReturnType<typeof createDatabaseAdapter>;
    fetchAdapter: ReturnType<typeof createFetchAdapter>;
    faviconAdapter: ReturnType<typeof createFaviconAdapter>;
    importExportAdapter: ReturnType<typeof createImportExportAdapter>;
    taskAdapter: ReturnType<typeof createTaskAdapter>;
    validationAdapter: ReturnType<typeof createValidationAdapter>;
    storageAdapter: typeof storageAdapter;
    repositories: RepositoryMap;
    appAdapter: ReturnType<typeof createAppAdapter>;
}>;

export function createAdapters(overrides: AdaptersOverrides = {}) {
    const browserAdapter = overrides.browserAdapter ?? createBrowserAdapter();
    const alertAdapter = overrides.alertAdapter ?? createAlertAdapter();
    const databaseAdapter = overrides.databaseAdapter ?? createDatabaseAdapter();
    const repositories = overrides.repositories ?? databaseAdapter.getAllRepositories();
    const fetchAdapter = overrides.fetchAdapter ?? createFetchAdapter();
    const faviconAdapter = overrides.faviconAdapter ?? createFaviconAdapter();
    const importExportAdapter =
        overrides.importExportAdapter ?? createImportExportAdapter();
    const taskAdapter = overrides.taskAdapter ?? createTaskAdapter();
    const validationAdapter = overrides.validationAdapter ?? createValidationAdapter();
    const appAdapter =
        overrides.appAdapter ??
        createAppAdapter({
            storageAdapter,
            databaseAdapter,
            fetchAdapter
        });

    return {
        browserAdapter,
        databaseAdapter,
        fetchAdapter,
        faviconAdapter,
        storageAdapter,
        importExportAdapter,
        taskAdapter,
        validationAdapter,
        appAdapter,
        alertAdapter,
        repositories,
    };
}
