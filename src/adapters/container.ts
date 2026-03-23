/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryMap} from "@/domain/types";

import {createAlertAdapter} from "@/adapters/secondary/alertAdapter";
import {createAppAdapter} from "@/adapters/secondary/appAdapter";
import {createBrowserAdapter} from "@/adapters/secondary/browserAdapter";
import {createDatabaseService} from "@/adapters/secondary/database/service";
import {createFaviconAdapter} from "@/adapters/secondary/faviconAdapter";
import {createFetchAdapter} from "@/adapters/secondary/fetchAdapter";
import {createImportExportAdapter} from "@/adapters/secondary/importExportAdapter";
import {storageAdapter} from "@/adapters/secondary/storageAdapter";
import {createTaskAdapter} from "@/adapters/secondary/taskAdapter";
import {createValidationAdapter} from "@/adapters/secondary/validationAdapter";

export type Services = ReturnType<typeof createServices>;

/**
 * Creates the runtime service container for a single extension context
 * (app/options/background). Consumers should access services via DI.
 */
export type ServicesOverrides = Partial<{
    browserService: ReturnType<typeof createBrowserAdapter>;
    alertService: ReturnType<typeof createAlertAdapter>;
    databaseService: ReturnType<typeof createDatabaseService>;
    fetchService: ReturnType<typeof createFetchAdapter>;
    faviconService: ReturnType<typeof createFaviconAdapter>;
    importExportService: ReturnType<typeof createImportExportAdapter>;
    taskService: ReturnType<typeof createTaskAdapter>;
    validationService: ReturnType<typeof createValidationAdapter>;
    storageAdapter: typeof storageAdapter;
    repositories: RepositoryMap;
    appService: ReturnType<typeof createAppAdapter>;
}>;

export function createServices(overrides: ServicesOverrides = {}) {
    const browserService = overrides.browserService ?? createBrowserAdapter();
    const alertService = overrides.alertService ?? createAlertAdapter();
    const databaseService = overrides.databaseService ?? createDatabaseService();
    const repositories = overrides.repositories ?? databaseService.getAllRepositories();
    const fetchService = overrides.fetchService ?? createFetchAdapter();
    const faviconService = overrides.faviconService ?? createFaviconAdapter();
    const importExportService =
        overrides.importExportService ?? createImportExportAdapter();
    const taskService = overrides.taskService ?? createTaskAdapter();
    const validationService = overrides.validationService ?? createValidationAdapter();
    const appService =
        overrides.appService ??
        createAppAdapter({
            browserService,
            storageAdapter,
            databaseService,
            fetchService
        });

    return {
        browserService,
        databaseService,
        fetchService,
        faviconService,
        storageAdapter,
        importExportService,
        taskService,
        validationService,
        appService,
        alertService,
        repositories,
    };
}
