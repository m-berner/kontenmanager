/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryMap} from "@/domain/types";

import {createAlertAdapter} from "@/adapters/secondary/alertAdapter";
import {createAppAdapter} from "@/adapters/secondary/appAdapter";
import {createBrowserAdapter} from "@/adapters/secondary/browserAdapter";
import {createDatabaseAdapter} from "@/adapters/secondary/database/databaseAdapter";
import {createFaviconAdapter} from "@/adapters/secondary/faviconAdapter";
import {createFetchAdapter} from "@/adapters/secondary/fetchAdapter";
import {createImportExportAdapter} from "@/adapters/secondary/importExportAdapter";
import {storageAdapter} from "@/adapters/secondary/storageAdapter";
import {createTaskAdapter} from "@/adapters/secondary/taskAdapter";
import {createValidationAdapter} from "@/adapters/secondary/validationAdapter";

export type Adapters = ReturnType<typeof createAdapters>;

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
            browserAdapter,
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
