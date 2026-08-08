/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppError, AppErrorCategoryType} from "@/domain/types";

export const ERROR_DEFINITIONS = {
    ADD_ACCOUNT: {CODE: "#olt", MSG: "Failed to add the account"},
    CHECKBOX_GRID: {CODE: "#rzg", MSG: "Failed to save selection"},
    DELETE_ACCOUNT_CONFIRMATION: {CODE: "#khi", MSG: "Failed to delete the account"},
    DELETE_BOOKING_TYPE: {CODE: "#pol", MSG: "Failed to delete the booking type"},
    FADE_IN_STOCK: {CODE: "#fis", MSG: "Failed to reactivate stock"},
    STOCK_FORM: {CODE: "#sfo", MSG: "Failed to update the stock form"},
    APP_SERVICE: {CODE: "#gxl", MSG: "Application service error"},
    UNKNOWN_ERROR: {CODE: "#poz", MSG: "Unknown error"},

    EXPORT_DATABASE: {
        A: {CODE: "#edx", MSG: "Export validation failed"},
        B: {CODE: "#edz", MSG: "Export integrity check failed"},
        C: {CODE: "#edm", MSG: "Export failed"},
        TOO_LARGE: {
            CODE: "#edl",
            MSG: "Export exceeds the maximum size this app can re-import"
        }
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
        // C (#syi) removed as unreferenced. E never existed — the gap is why
        // the letters are not renumbered here: F/G/H have live callers
        // (importExportAdapter) and renaming them would churn call sites for no
        // behavioral gain. Prefer a semantic key over the next free letter
        // when adding to this block.
        D: {CODE: "#syj", MSG: "Failed to validate backup data"},
        F: {CODE: "#syl", MSG: "Backup file exceeds the maximum allowed size"},
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
            A: {CODE: "#alx", MSG: "Confirmation dialog is already active"},
            SINK_UNAVAILABLE: {
                CODE: "#alu",
                MSG: "Confirmation could not be presented"
            }
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
                J: {CODE: "#dbv", MSG: "Database operation failed"},
                K: {CODE: "#dbw", MSG: "Transaction mode mismatch"}
            },
            A: {CODE: "#dbx", MSG: "Failed to open the IndexedDB connection"},
            B: {CODE: "#dca", MSG: "Error closing the database"},
            // C (#dcb) and E (#dcd) both read "Delete operation requires a key";
            // F (#dce) duplicated D's "Unknown operation type". All three were
            // unreferenced — verified by symbol (ERROR_DEFINITIONS.SERVICES.
            // DATABASE.x) and by raw code string across src/ and tests/ — so
            // removing them also removes the duplicate messages. D is the only
            // one with a caller (batchOperations' executeOperation default).
            D: {CODE: "#dcc", MSG: "Unknown operation type"},
            G: {CODE: "#dcf", MSG: "Database connection blocked by another open tab"},
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
        G: {CODE: "#ubg", MSG: "Failed to open the option's page"},
        H: {CODE: "#ubh", MSG: "Failed to show browser notification"},
        I: {CODE: "#ubi", MSG: "Invalid export filename"},
        J: {CODE: "#ubj", MSG: "Failed to download the export file"},
        K: {CODE: "#ubk", MSG: "Failed to close the browser tab"},
        L: {CODE: "#ubl", MSG: "Failed to determine the current browser tab"}
    }
} as const;

export type ErrorCodes = ExtractErrorCodes<typeof ERROR_DEFINITIONS>;

/** A WebExtension i18n message key. Kept as `string` here since the concrete
 *  key set lives in the UI layer's `_locales` resources, which the domain
 *  layer must not depend on. */
export type Messages = string;

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

type ExtractErrorCodes<T> =
    T extends { CODE: infer C }
        ? C extends string
            ? C
            : never
        : T extends object
            ? { [K in keyof T]: ExtractErrorCodes<T[K]> }[keyof T]
            : never;


type WebExtBrowserLike = {
    i18n?: { getMessage?: (_key: string) => string };
};

/**
 * Creates a custom application error with a specified code, category, and optional context.
 *
 * @param code - The error code to identify the error. It can be a WebExtension i18n key or a stable error code.
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

    // Stable error codes (from ERROR_DEFINITIONS) are always "#"-prefixed;
    // anything else is treated as a WebExtension i18n message key.
    if (String(code).startsWith("#")) {
        message =
            findErrorMsg(ERROR_DEFINITIONS, String(code)) ??
            `${i18nMessage("xx_error_code") ?? fallbackLabel("xx_error_code")}: ${code}`;
    } else {
        message =
            i18nMessage(code) ??
            `${i18nMessage("xx_missing_translation") ?? fallbackLabel("xx_missing_translation")}: ${code}`;
    }

    return new AppErrorImpl({
        message,
        code,
        category,
        recoverable,
        context
    });
}

/**
 * Determines if the provided value is an instance of an AppError.
 *
 * @param err - The value to check.
 * @returns True if the value is an AppError, otherwise false.
 */
export function isAppError(err: unknown): err is AppError {
    const name = (err as { name?: unknown } | null)?.name;
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
 * Whether the error is the alerts store's "a confirmation is already open"
 * rejection.
 *
 * `alerts.confirm()` **rejects** rather than resolving `false` when a second
 * confirmation is requested while one is up, and that rejection must be read as
 * *"not confirmed"* — a double delete click should quietly do nothing, not
 * surface an error about dialog state. `useMenu.confirmDestructive` had a local
 * `try/catch` saying exactly this; the import and export dialogs did not, so a
 * rejection there escaped into `runImport`'s catch, triggered a full rollback
 * and told the user their import had failed for an unrelated reason.
 *
 * The narrow code test matters. A blanket `catch` at those call sites would also
 * absorb `ALERTS.SINK_UNAVAILABLE` — the "could not present the confirmation at
 * all" failure that `alertAdapter.getAlertSinkOrThrow` was introduced to stop
 * being silently converted into a "no". Only this one rejection means "the user
 * did not confirm"; everything else is a real error and must propagate.
 */
export function isConfirmDialogBusyError(err: unknown): boolean {
    return isAppError(err) && err.code === ERROR_DEFINITIONS.STORES.ALERTS.A.CODE;
}

/**
 * Serializes an error into a plain, log-friendly record.
 *
 * For an {@link AppError} this now also carries `code`, `category` and
 * `context`. It used to return only `{name, message}`, which threw away the
 * whole point of the stable-code table: `message` is derived from `code` via
 * `findErrorMsg`, so the failure was still identifiable, but `context` — the
 * `{storeName, url, tabId, …}` payload each `appError()` call site
 * deliberately attaches — was lost. That is precisely what distinguishes two
 * occurrences of the same error, and this is the serializer on nearly every
 * diagnostic path (transactionManager, taskAdapter, useDialogGuards,
 * appAdapter, browserAdapter).
 *
 * The return type widened from `Record<string, string>` to
 * `Record<string, unknown>` to carry `context`.
 *
 * @param err - The error to serialize: an `Error`, an `AppError`, or anything else.
 * @returns A record with at least `name` and `message`; `code`, `category` and
 *          `context` are added when the input is an `AppError`.
 */
export function serializeError(err: unknown): Record<string, unknown> {
    if (isAppError(err)) {
        return {
            name: err.name,
            message: err.message,
            code: err.code,
            category: err.category,
            ...(err.context !== undefined ? {context: err.context} : {})
        };
    }
    if (err instanceof Error) {
        return {name: err.name, message: err.message};
    }

    // Reached only when the thrown value is neither an Error nor an AppError —
    // a thrown string, a rejected plain object, a structured-clone duck. It used
    // to stamp `name: "AppError"` here, which made the log line indistinguishable
    // from a genuine AppError whose code lookup had failed, hiding the one detail
    // this branch actually knows: that it was handed something that is not an
    // error at all. `thrownType` preserves it.
    return {
        name: "UnknownError",
        message: ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG,
        thrownType: err === null ? "null" : typeof err
    };
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

function fallbackLabel(key: "xx_missing_translation" | "xx_error_code"): string {
    return key === "xx_missing_translation" ? "Missing translation" : "Error code";
}

function findErrorMsg(node: object, code: string): string | undefined {
    if ("CODE" in node && "MSG" in node) {
        return (node as { CODE: string; MSG: string }).CODE === code
            ? (node as { CODE: string; MSG: string }).MSG
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

function i18nMessage(key: string): string | undefined {
    // Avoid referencing the free variable `browser` so tests/non-WebExtension contexts don't crash.
    const b = (globalThis as unknown as { browser?: WebExtBrowserLike }).browser;
    if (typeof b?.i18n?.getMessage !== "function") {
        return undefined;
    }

    try {
        // Called as a method, keeping `b.i18n` as the receiver. Pulling
        // `getMessage` off its object and invoking it bare passed
        // `this === undefined`; if the implementation or polyfill relies on the
        // receiver that throws a TypeError, the catch below reads it as "no
        // translation available", and every i18n-keyed error in the app then
        // renders as "Missing translation: xx_…" — silent, uniform, and easy to
        // misread as missing `_locales` entries rather than a binding bug.
        // `browserAdapter` invokes it as a method at both of its call sites;
        // this was the only place that did not.
        const msg = b.i18n.getMessage(key);
        if (msg.trim() !== "") {
            return msg;
        }
    } catch {
        // Treat i18n failures as "no translation available" and fall back.
    }

    return undefined;
}
