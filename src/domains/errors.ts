/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppErrorCategoryType} from "@/types";
import deNotifications from "@/_locales/de/messages.json";

export const ERROR_CODES = {
    ADD_ACCOUNT: "#olt",
    CHECKBOX_GRID: "#rzg",
    DELETE_ACCOUNT_CONFIRMATION: "#khi",
    DELETE_BOOKING_TYPE: "#pol",
    EXPORT_DATABASE: {
        A: "#edx",
        B: "#edz",
        C: "#edm"
    },
    FADE_IN_STOCK: "#fis",
    IMPORT_DATABASE: {
        A: "#idb",
        B: "#idz"
    },
    STOCK_FORM: "#sfo",
    USE_BROWSER: {
        A: "#uba",
        B: "#ubb",
        C: "#ubc",
        D: "#ubd",
        E: "#ube",
        F: "#ubf",
        G: "#ubg",
        H: "#ubh",
        I: "#ubi",
        J: "#ubj"
    },
    USE_DIALOG_GUARDS: {
        A: "#wqa",
        B: "#wqb",
        C: "#wqc"
    },
    USE_MENU: {
        A: "#sav",
        B: "#kcm"
    },
    USE_STORAGE: {
        A: "#sux",
        B: "#suz",
        C: "#sum",
        D: "#sus"
    },
    UTILS: {
        A: "#uta",
        B: "#utb",
        C: "#utc"
    },
    IMPORT_EXPORT: {
        A: "#imx",
        B: "#imy"
    },
    VALIDATION: {
        A: "#zzu",
        B: "#zzv",
        C: "#zzw",
        D: "#zzx"
    },
    IMPORT_EXPORT_SERVICE: {
        A: "#syg",
        B: "#syh",
        C: "#syi",
        D: "#syj",
        E: "#syk",
        F: "#syl",
        G: "#sym",
        H: "#syn"
    },
    APP_SERVICE: "#gxl",
    SERVICES: {
        APP: {
            // Storage initialization failed
            STORAGE: "#aps",
            // Missing or unsupported UI language/currency
            CURRENCY: "#apc",
            // Database initialization failure (connect/get/hydrate)
            DB: "#apd",
            // External fetch orchestration failure (non-critical) – used for wrapping/logging
            FETCH: "#apf",
            // Overall initializeApp failure
            OVERALL: "#apo"
        },
        DATABASE: {
            A: "#dbx",
            B: "#dca",
            C: "#dcb",
            D: "#dcc",
            E: "#dcd",
            F: "#dce",
            BASE: {
                A: "#dbz",
                B: "#dbm",
                C: "#dbn",
                D: "#dbo",
                E: "#dbp",
                F: "#dbq",
                G: "#dbr",
                H: "#dbs",
                I: "#dbt",
                J: "#dbv"
            },
            TRANSACTION_FAILED: "#kkb",
            NO_INDEX: "qyy",
            REQUEST_FAILED: "#ppz",
            INVALID_BATCH: "hgv"
        },
        FETCH: {
            A: "#nsl",
            B: "#nsm",
            C: "#nsn",
            D: "#nso",
            E: "#nsp",
            F: "#nsq",
            G: "#nst",
            H: "#nsu",
            I: "#nsx",
            J: "#nsy"
        }
    },
    STORES: {
        BOOKINGS: {
            A: "#bks"
        }
    },
    VIEWS: {
        APP_INDEX: {
            A: "#nay"
        }
    }
};
export const ERROR_CATEGORY = {
    DATABASE: "database",
    NETWORK: "network",
    VALIDATION: "validation",
    BUSINESS: "business",
    BROWSER_API: "Browser API",
    NOTIFICATION_API: "Notification API",
    STORAGE_API: "Storage API",
    STORE: "Memory store"
};
const ERRORS: Record<string, string> = {
    [ERROR_CODES.ADD_ACCOUNT]: "Failed to add account",
    [ERROR_CODES.CHECKBOX_GRID]: "Failed to save selection",
    [ERROR_CODES.DELETE_ACCOUNT_CONFIRMATION]: "Failed to delete account",
    [ERROR_CODES.DELETE_BOOKING_TYPE]: "Failed to delete booking type",
    [ERROR_CODES.FADE_IN_STOCK]: "Failed to reactivate stock",
    [ERROR_CODES.STOCK_FORM]: "Failed to update stock form",
    [ERROR_CODES.APP_SERVICE]: "Application service error",

    [ERROR_CODES.EXPORT_DATABASE.A]: "Export validation failed",
    [ERROR_CODES.EXPORT_DATABASE.B]: "Export integrity check failed",
    [ERROR_CODES.EXPORT_DATABASE.C]: "Export failed",

    [ERROR_CODES.IMPORT_DATABASE.A]: "Import failed",
    [ERROR_CODES.IMPORT_DATABASE.B]: "Import failed (rollback attempted)",

    [ERROR_CODES.IMPORT_EXPORT.A]: "Import/export failed",
    [ERROR_CODES.IMPORT_EXPORT.B]: "Import/export failed",

    [ERROR_CODES.USE_DIALOG_GUARDS.A]: "Dialog guard failed",
    [ERROR_CODES.USE_DIALOG_GUARDS.B]: "Form submit failed",
    [ERROR_CODES.USE_DIALOG_GUARDS.C]: "Database connection check failed",

    [ERROR_CODES.USE_MENU.A]: "Unknown menu action",
    [ERROR_CODES.USE_MENU.B]: "Menu action failed",

    [ERROR_CODES.USE_STORAGE.A]: "Failed to clear local storage",
    [ERROR_CODES.USE_STORAGE.B]: "Failed to write local storage",
    [ERROR_CODES.USE_STORAGE.C]: "Failed to read local storage",
    [ERROR_CODES.USE_STORAGE.D]: "Failed to install storage defaults",

    [ERROR_CODES.UTILS.A]: "Invalid ISO date",
    [ERROR_CODES.UTILS.B]: "Invalid timestamp",
    [ERROR_CODES.UTILS.C]: "Failed to parse number",

    [ERROR_CODES.VALIDATION.A]: "Invalid booking data",
    [ERROR_CODES.VALIDATION.B]: "Invalid account data",
    [ERROR_CODES.VALIDATION.C]: "Invalid stock data",
    [ERROR_CODES.VALIDATION.D]: "Invalid booking type data",

    [ERROR_CODES.IMPORT_EXPORT_SERVICE.A]: "Failed to read JSON file",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.B]: "Invalid backup format",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.C]: "Backup integrity check failed",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.D]: "Failed to validate backup data",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.E]: "Failed to transform legacy stock",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.F]: "Unsupported legacy booking",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.G]: "Failed to stringify database export",
    [ERROR_CODES.IMPORT_EXPORT_SERVICE.H]: "Failed to verify export integrity",

    [ERROR_CODES.VIEWS.APP_INDEX.A]: "App initialization failed",
    [ERROR_CODES.STORES.BOOKINGS.A]: "No booking found for ID",

    // Services/App specific
    [ERROR_CODES.SERVICES.APP.STORAGE]: "Failed to initialize storage",
    [ERROR_CODES.SERVICES.APP.CURRENCY]:
        "Unsupported or missing currency configuration",
    [ERROR_CODES.SERVICES.APP.DB]: "Failed to initialize database",
    [ERROR_CODES.SERVICES.APP.FETCH]: "Failed to fetch external data",
    [ERROR_CODES.SERVICES.APP.OVERALL]: "Application initialization failed",

    [ERROR_CODES.SERVICES.DATABASE.BASE.A]: "Failed to delete by cursor",
    [ERROR_CODES.SERVICES.DATABASE.BASE.B]: "Failed to add record",
    [ERROR_CODES.SERVICES.DATABASE.BASE.C]: "Failed to get record",
    [ERROR_CODES.SERVICES.DATABASE.BASE.D]: "Failed to getAll records",
    [ERROR_CODES.SERVICES.DATABASE.BASE.E]: "Failed to update record",
    [ERROR_CODES.SERVICES.DATABASE.BASE.F]: "Failed to delete record",
    [ERROR_CODES.SERVICES.DATABASE.BASE.G]: "Failed to clear store",
    [ERROR_CODES.SERVICES.DATABASE.BASE.H]: "Failed to get all records by index",
    [ERROR_CODES.SERVICES.DATABASE.BASE.I]: "Database not connected",
    [ERROR_CODES.SERVICES.DATABASE.BASE.J]: "Database operation failed",

    [ERROR_CODES.SERVICES.DATABASE.A]: "Failed to open IndexedDB connection",
    [ERROR_CODES.SERVICES.DATABASE.B]: "Error closing database",
    [ERROR_CODES.SERVICES.DATABASE.C]: "Delete operation requires a key",
    [ERROR_CODES.SERVICES.DATABASE.D]: "Unknown operation type",
    [ERROR_CODES.SERVICES.DATABASE.E]: "Delete operation requires a key",
    [ERROR_CODES.SERVICES.DATABASE.F]: "Unknown operation type",
    [ERROR_CODES.SERVICES.DATABASE.TRANSACTION_FAILED]: "Transaction failed",
    [ERROR_CODES.SERVICES.DATABASE.NO_INDEX]: "Missing index",
    [ERROR_CODES.SERVICES.DATABASE.REQUEST_FAILED]: "Request failed",
    [ERROR_CODES.SERVICES.DATABASE.INVALID_BATCH]: "Invalid batch",

    [ERROR_CODES.SERVICES.FETCH.A]: "Failed to receive data",
    [ERROR_CODES.SERVICES.FETCH.B]: "Invalid HTML input",
    [ERROR_CODES.SERVICES.FETCH.C]: "Invalid ISIN format",
    [ERROR_CODES.SERVICES.FETCH.D]: "Service configuration not found",
    [ERROR_CODES.SERVICES.FETCH.E]: "Company not found or inactive",
    [ERROR_CODES.SERVICES.FETCH.F]: "Symbol not found",
    [ERROR_CODES.SERVICES.FETCH.G]: "Service not configured",
    [ERROR_CODES.SERVICES.FETCH.H]: "Unsupported service",
    [ERROR_CODES.SERVICES.FETCH.I]: "FX service not configured",
    [ERROR_CODES.SERVICES.FETCH.J]: "Exchange rate not found",

    [ERROR_CODES.USE_BROWSER.A]: "Could not read the browser language",
    [ERROR_CODES.USE_BROWSER.B]: "Invalid browser language format",
    [ERROR_CODES.USE_BROWSER.C]: "Failed to create browser tab",
    [ERROR_CODES.USE_BROWSER.D]: "Failed to query browser tabs",
    [ERROR_CODES.USE_BROWSER.E]: "Failed to focus browser window",
    [ERROR_CODES.USE_BROWSER.F]: "Failed to activate browser tab",
    [ERROR_CODES.USE_BROWSER.G]: "Failed to open options page",
    [ERROR_CODES.USE_BROWSER.H]: "Failed to show browser notification",
    [ERROR_CODES.USE_BROWSER.I]: "Invalid export filename",
    [ERROR_CODES.USE_BROWSER.J]: "Failed to download export file"
};

/**
 * Convert unknown thrown values into a safe, serializable structure for AppError context.
 */
export function serializeError(err: unknown): Record<string, string> {
    if (err instanceof AppError || err instanceof Error) {
        return {name: err.name, message: err.message};
    }
    return {name: "AppError", message: "unknown"};
}

/**
 * Custom error class for application-specific errors.
 * Includes additional context for better debugging and error handling.
 */
export class AppError extends Error {
    /**
     * @param code - Unique error code for identification.
     * @param category - Classification of the error (e.g., 'database', 'network').
     * @param context - Optional key-value pairs with extra debugging information.
     * @param recoverable - Whether the application can continue after this error.
     */
    constructor(
        public readonly code: keyof typeof deNotifications | keyof typeof ERRORS,
        public readonly category: AppErrorCategoryType,
        public readonly recoverable: boolean = true,
        public readonly context?: Record<string, unknown>
    ) {
        let message: string;

        // Check if it's in messages.json
        if (code in deNotifications) {
            message =
                browser.i18n.getMessage(code) ||
                `${browser.i18n.getMessage("xx_missing_translation")}: ${code}`;
        }
        // Check if it's in ERRORS
        else if (code in ERRORS) {
            message = ERRORS[code];
        }
        // Invalid code
        else {
            message = `${browser.i18n.getMessage("xx_error_code")}: ${code}`;
        }
        super(message);
        this.name = "AppError";
    }
}
