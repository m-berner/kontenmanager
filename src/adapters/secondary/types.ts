/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

// Central type-only re-exports for the DI surface.
// This allows guardrails to forbid importing concrete services from UI code.

export type {Adapters, AdaptersOverrides} from "@/adapters/container";
export type {AlertAdapter} from "@/adapters/secondary/alertAdapter";
export type {AppAdapter, AppAdapterDeps} from "@/adapters/secondary/appAdapter";
export type {BrowserAdapter} from "@/adapters/secondary/browserAdapter";
export type {Service as DatabaseAdapter} from "@/adapters/secondary/database/service";
export type {ImportExportAdapter} from "@/adapters/secondary/importExportAdapter";
export type {RepositoryMap, RepositoryType} from "@/domain/types";
