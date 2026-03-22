/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryMap} from "@/domain/types";

import {createAlertService} from "@/adapters/secondary/alert";
import {createAppService} from "@/adapters/secondary/app";
import {createBrowserService} from "@/adapters/secondary/browserService";
import {createDatabaseService} from "@/adapters/secondary/database/service";
import {createFaviconService} from "@/adapters/secondary/faviconService";
import {createFetchService} from "@/adapters/secondary/fetch";
import {createImportExportService} from "@/adapters/secondary/importExport";
import {storageAdapter} from "@/adapters/secondary/storageAdapter";
import {createTaskService} from "@/adapters/secondary/taskService";
import {createValidationService} from "@/adapters/secondary/validation";

export type Services = ReturnType<typeof createServices>;

/**
 * Creates the runtime service container for a single extension context
 * (app/options/background). Consumers should access services via DI.
 */
export type ServicesOverrides = Partial<{
    browserService: ReturnType<typeof createBrowserService>;
    alertService: ReturnType<typeof createAlertService>;
    databaseService: ReturnType<typeof createDatabaseService>;
    fetchService: ReturnType<typeof createFetchService>;
    faviconService: ReturnType<typeof createFaviconService>;
    importExportService: ReturnType<typeof createImportExportService>;
    taskService: ReturnType<typeof createTaskService>;
    validationService: ReturnType<typeof createValidationService>;
    storageAdapter: typeof storageAdapter;
    repositories: RepositoryMap;
    appService: ReturnType<typeof createAppService>;
}>;

export function createServices(overrides: ServicesOverrides = {}) {
    const browserService = overrides.browserService ?? createBrowserService();
    const alertService = overrides.alertService ?? createAlertService();
    const databaseService = overrides.databaseService ?? createDatabaseService();
    const repositories = overrides.repositories ?? databaseService.getAllRepositories();
    const fetchService = overrides.fetchService ?? createFetchService();
    const faviconService = overrides.faviconService ?? createFaviconService();
    const importExportService =
        overrides.importExportService ?? createImportExportService();
    const taskService = overrides.taskService ?? createTaskService();
    const validationService = overrides.validationService ?? createValidationService();

    const appService =
        overrides.appService ??
        createAppService({
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
