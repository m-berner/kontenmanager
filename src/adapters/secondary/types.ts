/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

// Central type-only re-exports for the DI surface.
// This allows guardrails to forbid importing concrete services from UI code.

export type {Services, ServicesOverrides} from "@/adapters/container";
export type {AlertService} from "@/adapters/secondary/alert";
export type {AppService, AppServiceDeps} from "@/adapters/secondary/app";
export type {BrowserService} from "@/adapters/secondary/browserService";
export type {Service as DatabaseService} from "@/adapters/secondary/database/service";
export type {ImportExportService} from "@/adapters/secondary/importExport";
export type {RepositoryMap, RepositoryType} from "@/domain/types";
