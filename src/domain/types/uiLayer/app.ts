/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ErrorCodes} from "@/domain/errors";

import deNotifications from "@/adapters/primary/_locales/de/messages.json";

/**
 * Represents a custom application error that extends the standard JavaScript Error object.
 * This interface provides additional properties to categorize and handle errors specific to the application.
 */
export interface AppError extends Error {
    code: keyof typeof deNotifications | ErrorCodes;
    category: AppErrorCategoryType;
    recoverable: boolean;
    context?: Record<string, unknown>;
}

/**
 * Category of application errors for classification.
 */
export type AppErrorCategoryType =
    | (typeof import("@/domain/constants").ERROR_CATEGORY)[keyof typeof import("@/domain/constants").ERROR_CATEGORY];

/**
 * Metadata about the application.
 */
export interface AppMetadata {
    /** Application version. */
    cVersion: number;
    /** Database schema version. */
    cDBVersion: number;
    /** Application engine identifier. */
    cEngine: string;
}

/**
 * Current initialization status of application subsystems.
 */
export interface AppStatus {
    /** Status of the browser storage. */
    storage: "ok" | "aborted" | "error";
    /** Status of the IndexedDB connection. */
    db: "ok" | "aborted" | "error";
    /** Status of various online data fetchers. */
    fetch: {
        /** Whether exchange rates were fetched successfully. */
        exchanges: boolean;
        /** Whether stock indexes were fetched successfully. */
        indexes: boolean;
        /** Whether commodity prices were fetched successfully. */
        materials: boolean;
    };
}

/**
 * Severity levels for logging.
 */
export type {LogLevelType} from "@/domain/types/ui";

/**
 * Generic mapping for i18n translation keys.
 */
export type TranslationKeysType = {
    [p: string]: string;
};
