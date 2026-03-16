/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppError, AppErrorCategoryType} from "@/types";
import deNotifications from "@/_locales/de/messages.json";
import {browserService} from "@/services/browserService";

export const ERROR_DEFINITIONS = {
    ADD_ACCOUNT: {CODE: "#olt", MSG: "Failed to add the account"},
    CHECKBOX_GRID: {CODE: "#rzg", MSG: "Failed to save selection"},
    DELETE_ACCOUNT_CONFIRMATION: {CODE: "#khi", MSG: "Failed to delete the account"},
    DELETE_BOOKING_TYPE: {CODE: "#pol", MSG: "Failed to delete the booking type"},
    FADE_IN_STOCK: {CODE: "#fis", MSG: "Failed to reactivate stock"},
    STOCK_FORM: {CODE: "#sfo", MSG: "Failed to update the stock form"},
    APP_SERVICE: {CODE: "#gxl", MSG: "Application service error"},

    EXPORT_DATABASE: {
        A: {CODE: "#edx", MSG: "Export validation failed"},
        B: {CODE: "#edz", MSG: "Export integrity check failed"},
        C: {CODE: "#edm", MSG: "Export failed"}
    },

    IMPORT_DATABASE: {
        A: {CODE: "#idb", MSG: "Import failed"},
        B: {CODE: "#idz", MSG: "Import failed (rollback attempted)"}
    },

    IMPORT_EXPORT: {
        A: {CODE: "#imx", MSG: "Import/export failed"},
        B: {CODE: "#imy", MSG: "Import/export failed"},
    },

    USE_DIALOG_GUARDS: {
        A: {CODE: "#wqa", MSG: "Dialog guard failed"},
        B: {CODE: "#wqb", MSG: "Form submit failed"},
        C: {CODE: "#wqc", MSG: "Database connection check failed"}
    },

    USE_MENU: {
        A: {CODE: "#sav", MSG: "Unknown menu action"},
        B: {CODE: "#kcm", MSG: "Menu action failed"}
    },

    USE_STORAGE: {
        A: {CODE: "#sux", MSG: "Failed to clear local storage"},
        B: {CODE: "#suz", MSG: "Failed to write local storage"},
        C: {CODE: "#sum", MSG: "Failed to read local storage"},
        D: {CODE: "#sus", MSG: "Failed to install storage defaults"}
    },

    UTILS: {
        A: {CODE: "#uta", MSG: "Invalid ISO date"},
        B: {CODE: "#utb", MSG: "Invalid timestamp"},
        C: {CODE: "#utc", MSG: "Failed to parse the number"}
    },

    VALIDATION: {
        A: {CODE: "#zzu", MSG: "Invalid booking data"},
        B: {CODE: "#zzv", MSG: "Invalid account data"},
        C: {CODE: "#zzw", MSG: "Invalid stock data"},
        D: {CODE: "#zzx", MSG: "Invalid booking type data"}
    },

    IMPORT_EXPORT_SERVICE: {
        A: {CODE: "#syg", MSG: "Failed to read JSON file"},
        B: {CODE: "#syh", MSG: "Invalid backup format"},
        C: {CODE: "#syi", MSG: "Backup integrity check failed"},
        D: {CODE: "#syj", MSG: "Failed to validate backup data"},
        E: {CODE: "#syk", MSG: "Failed to transform legacy stock"},
        F: {CODE: "#syl", MSG: "Unsupported legacy booking"},
        G: {CODE: "#sym", MSG: "Failed to stringify database export"},
        H: {CODE: "#syn", MSG: "Failed to verify export integrity"}
    },
    VIEWS: {
        APP_INDEX: {
            A: {CODE: "#nay", MSG: "App initialization failed"}
        }
    },
    STORES: {
        BOOKINGS: {
            A: {CODE: "#bks", MSG: "No booking found for ID"}
        },
        ALERTS: {
            A: {CODE: "#alx", MSG: "Confirmation dialog is already active"}
        }
    },
    SERVICES: {
        APP: {
            STORAGE: {CODE: "#aps", MSG: "Failed to initialize storage"},
            CURRENCY: {CODE: "#apc", MSG: "Unsupported or missing currency configuration"},
            DB: {CODE: "#apd", MSG: "Failed to initialize the database"},
            FETCH: {CODE: "#apf", MSG: "Failed to fetch external data"},
            OVERALL: {CODE: "#apo", MSG: "Application initialization failed"},
            FEEDBACK: {CODE: "#apl", MSG: "Translated message"}
        },
        DATABASE: {
            BASE: {
                A: {CODE: "#dbz", MSG: "Failed to delete by cursor"},
                B: {CODE: "#dbm", MSG: "Failed to add record"},
                C: {CODE: "#dbn", MSG: "Failed to get the record"},
                D: {CODE: "#dbo", MSG: "Failed to getAll records"},
                E: {CODE: "#dbp", MSG: "Failed to update record"},
                F: {CODE: "#dbq", MSG: "Failed to delete record"},
                G: {CODE: "#dbr", MSG: "Failed to clear store"},
                H: {CODE: "#dbs", MSG: "Failed to get all records by index"},
                I: {CODE: "#dbt", MSG: "Database is not connected"},
                J: {CODE: "#dbv", MSG: "Database operation failed"}
            },
            A: {CODE: "#dbx", MSG: "Failed to open the IndexedDB connection"},
            B: {CODE: "#dca", MSG: "Error closing database"},
            C: {CODE: "#dcb", MSG: "Delete operation requires a key"},
            D: {CODE: "#dcc", MSG: "Unknown operation type"},
            E: {CODE: "#dcd", MSG: "Delete operation requires a key"},
            F: {CODE: "#dce", MSG: "Unknown operation type"},
            TRANSACTION_FAILED: {CODE: "#kkb", MSG: "Transaction failed"},
            NO_INDEX: {CODE: "#qyy", MSG: "Missing index"},
            REQUEST_FAILED: {CODE: "#ppz", MSG: "Request failed"},
            INVALID_BATCH: {CODE: "#hgv", MSG: "Invalid batch"}
        },
        FETCH: {
            A: {CODE: "#nsl", MSG: "Failed to receive data"},
            B: {CODE: "#nsm", MSG: "Invalid HTML input"},
            C: {CODE: "#nsn", MSG: "Invalid ISIN format"},
            D: {CODE: "#nso", MSG: "Service configuration not found"},
            E: {CODE: "#nsp", MSG: "The company was not found or is inactive"},
            F: {CODE: "#nsq", MSG: "Symbol not found"},
            G: {CODE: "#nst", MSG: "Service is not configured"},
            H: {CODE: "#nsu", MSG: "Unsupported service"},
            I: {CODE: "#nsx", MSG: "FX service is not configured"},
            J: {CODE: "#nsy", MSG: "Exchange rate not found"}
        }
    },
    USE_BROWSER: {
        A: {CODE: "#uba", MSG: "Could not read the browser language"},
        B: {CODE: "#ubb", MSG: "Invalid browser language format"},
        C: {CODE: "#ubc", MSG: "Failed to create the browser tab"},
        D: {CODE: "#ubd", MSG: "Failed to query browser tabs"},
        E: {CODE: "#ube", MSG: "Failed to focus the browser window"},
        F: {CODE: "#ubf", MSG: "Failed to activate the browser tab"},
        G: {CODE: "#ubg", MSG: "Failed to open the options page"},
        H: {CODE: "#ubh", MSG: "Failed to show browser notification"},
        I: {CODE: "#ubi", MSG: "Invalid export filename"},
        J: {CODE: "#ubj", MSG: "Failed to download the export file"}
    }
} as const;

type ExtractErrorCodes<T> =
    T extends {CODE: infer C}
        ? C extends string
            ? C
            : never
        : T extends object
            ? {[K in keyof T]: ExtractErrorCodes<T[K]>}[keyof T]
            : never;

export type ErrorCodes = ExtractErrorCodes<typeof ERROR_DEFINITIONS>;
export type Messages = keyof typeof deNotifications;

/**
 * Determines if the provided value is an instance of an AppError.
 *
 * @param err - The value to check.
 * @returns True if the value is an AppError, otherwise false.
 */
export function isAppError(err: unknown): err is AppError {
    const name = (err as {name?: unknown} | null)?.name;
    return (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        name === "AppError" &&
        "code" in err &&
        "category" in err
    );
}

/**
 * Serializes an error object into a simple key-value pair representation.
 *
 * @param err - The error object to serialize. It could be an instance of `Error`, an application-specific error, or any unknown value.
 * @returns A record containing the `name` and `message` properties derived from the error. If the input is not a recognized error, returns a default object with `name` as "AppError" and `message` as "unknown".
 */
export function serializeError(err: unknown): Record<string, string> {
    if (isAppError(err) || err instanceof Error) {
        return {name: err.name, message: err.message};
    }
    return {name: "AppError", message: "unknown"};
}

/**
 * Normalizes an unknown value into an Error instance.
 * Useful for retry hooks and APIs that expect Error.
 */
export function toError(err: unknown): Error {
    if (err instanceof Error) {
        return err;
    }

    if (typeof err === "string") {
        return new Error(err);
    }

    if (err && typeof err === "object") {
        try {
            return new Error(JSON.stringify(err));
        } catch {
            // Fall through
        }
    }

    return new Error(String(err));
}

function findErrorMsg(node: object, code: string): string | undefined {
    if ("CODE" in node && "MSG" in node) {
        return (node as {CODE: string; MSG: string}).CODE === code
            ? (node as {CODE: string; MSG: string}).MSG
            : undefined;
    }
    for (const child of Object.values(node)) {
        if (child && typeof child === "object") {
            const result = findErrorMsg(child, code);
            if (result !== undefined) return result;
        }
    }
    return undefined;
}

class AppErrorImpl extends Error {
    code: Messages | ErrorCodes;
    category: AppErrorCategoryType;
    recoverable: boolean;
    context?: Record<string, unknown>;

    constructor(opts: {
        message: string;
        code: Messages | ErrorCodes;
        category: AppErrorCategoryType;
        recoverable: boolean;
        context?: Record<string, unknown>;
    }) {
        super(opts.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = "AppError";
        this.code = opts.code;
        this.category = opts.category;
        this.recoverable = opts.recoverable;
        this.context = opts.context;
    }
}

/**
 * Creates a custom application error with a specified code, category, and optional context.
 *
 * @param code - The error code to identify the error. It can be a key from `deNotifications` or `ERRORS`.
 * @param category - The category to which this error belongs.
 * @param recoverable - Indicates whether the error is recoverable.
 * @param context - Optional additional context or metadata related to the error.
 * @returns A custom error object containing detailed error information.
 */
export function appError(
    code: Messages | ErrorCodes,
    category: AppErrorCategoryType,
    recoverable = true,
    context?: Record<string, unknown>
): AppError {
    let message: string;

    // Check if it's in messages.json
    if (code in deNotifications) {
        message =
            browserService.getMessage(code) ||
            `${browserService.getMessage("xx_missing_translation")}: ${code}`;
    }
    // Invalid code
    else {
        message =
            findErrorMsg(ERROR_DEFINITIONS, code) ??
            `${browserService.getMessage("xx_error_code")}: ${code}`;
    }

    return new AppErrorImpl({
        message,
        code,
        category,
        recoverable,
        context
    });
}
