/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError,} from "@/domain/errors";
import type {EventTypes} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const APP_URL = "entrypoints/app.html";
const APP_TITLE = "KontenManager";
const COMPLETE: EventTypes = "complete";
const INTERRUPTED: EventTypes = "interrupted";

export type BrowserAdapter = ReturnType<typeof createBrowserAdapter>;

export function createBrowserAdapter() {
    return {
        actionOnClicked,
        getMessage,
        getUserLocale,
        manifest,
        openOptionsPage,
        removeTab,
        runtimeOnInstalled,
        showSystemNotification,
        tabsCreate,
        tabsQuery,
        tabsUpdate,
        windowsUpdate,
        writeBufferToFile
    };
}

/**
 * Registers a listener for the extension action button click.
 *
 * @param listener - Called with the clicked tab and optional click data.
 */
function actionOnClicked(
    listener: (
        _tab: browser.tabs.Tab,
        _info?: browser.action.OnClickData
    ) => void
): void {
    browser.action.onClicked.addListener(listener);
}

/**
 * Returns the translated message for the given i18n code.
 * Falls back to the generic error message, then to the raw code itself.
 *
 * @param code - i18n message key.
 * @returns The translated string, never empty.
 */
function getMessage(code: string): string {
    const msg = browser.i18n.getMessage(code);
    if (msg && msg.trim() !== "") {
        return msg;
    }

    const fallback = browser.i18n.getMessage("xx_error_code");
    if (fallback && fallback.trim() !== "") {
        return fallback;
    }

    // Last resort: return the code so callers can still show something.
    return code;
}

/**
 * Detects the browser's 5-character locale code (e.g., 'en-US', 'de-DE').
 *
 * Falls back to constructing a locale if only a 2-character language is found.
 *
 * @returns The detected locale code.
 * @throws {AppError} If the language cannot be determined.
 */
function locale5() {
    const defaultLanguage = `${navigator.languages[0]}`;

    if (defaultLanguage.length === 5) {
        return defaultLanguage;
    }

    if (defaultLanguage.length === 2) {
        return `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
    }

    throw appError(
        ERROR_DEFINITIONS.USE_BROWSER.A.CODE,
        ERROR_CATEGORY.BROWSER_API,
        true
    );
}

/**
 * Returns the user locale if it is one of the supported values ("de-DE", "en-US"),
 * otherwise falls back to "en-US".
 */
function getUserLocale(): "de-DE" | "en-US" {
    try {
        const userLocale = locale5();

        if (userLocale === "de-DE" || userLocale === "en-US") {
            return userLocale;
        }
        return "en-US";
    } catch (err) {
        // Keep this service independent of UI/Pinia/alerts.
        log("SERVICES browserAdapter: getUserLocale fallback", err, "warn");
        return "en-US";
    }
}

/**
 * Returns the current extension manifest.
 */
function manifest() {
    return browser.runtime.getManifest()
}

/**
 * Opens the extension's options page.
 *
 * @throws {AppError} If the browser API call fails.
 */
async function openOptionsPage(): Promise<void> {
    try {
        await browser.runtime.openOptionsPage();
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.G.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * Closes a specific tab.
 *
 * @param tabId - ID of the tab to close.
 * @throws {AppError} If the browser API call fails.
 */
async function removeTab(tabId: number): Promise<void> {
    try {
        await browser.tabs.remove(tabId);
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.H.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {tabId, originalError: serializeError(err)}
        );
    }
}

/**
 * Registers a listener for extension installation or update events.
 *
 * @param listener - Called with install/update details when the event fires.
 */
function runtimeOnInstalled(
    listener: (
        _details: browser.runtime._OnInstalledDetails | undefined
    ) => Promise<void>
): void {
    browser.runtime.onInstalled.addListener(listener);
}

/**
 * Displays a browser notification.
 * Best for background processes or system-level alerts.
 * For foreground UI feedback, prefer `useAlert`.
 *
 * @param mod - Name of the calling module, used as the notification prefix.
 * @param messageOrError - The content to display: a string, array of lines, or any Error value.
 */
async function showSystemNotification(
    mod: string,
    messageOrError: string | string[] | Error | unknown
): Promise<void> {
    try {
        let messages: string[] = [];
        if (isAppError(messageOrError)) {
            let msg = browser.i18n.getMessage(messageOrError.code);
            if (msg === "") {
                msg = messageOrError.message;
            }
            messages = [`${mod}: ${messageOrError.category}`, msg];
        } else if (messageOrError instanceof Error) {
            messages = [mod, messageOrError.name, messageOrError.message];
        } else if (typeof messageOrError === "string") {
            messages = [mod, messageOrError];
        } else if (Array.isArray(messageOrError)) {
            messages = [mod, ...messageOrError];
        } else {
            messages = [mod, "Unknown user message"];
        }

        const notificationOption: browser.notifications.CreateNotificationOptions =
            {
                type: "basic",
                iconUrl: "assets/icon64.png",
                title: APP_TITLE,
                message: messages.join("\n")
            };
        await browser.notifications.create(notificationOption);
    } catch (err) {
        log(
            "SERVICES browserAdapter: Notification failed",
            {error: serializeError(err)},
            "error"
        );
    }
}

/**
 * Opens the extension's main page in a new active tab.
 *
 * @throws {AppError} If the browser API call fails.
 */
async function tabsCreate(): Promise<browser.tabs.Tab> {
    try {
        return await browser.tabs.create({
            url: browser.runtime.getURL(APP_URL),
            active: true
        });
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.C.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * Returns all open tabs showing the extension's main page.
 *
 * @throws {AppError} If the browser API call fails.
 */
async function tabsQuery(): Promise<browser.tabs.Tab[]> {
    try {
        return await browser.tabs.query({url: browser.runtime.getURL(APP_URL)});
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.D.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * Activates a specific tab.
 *
 * @param tabId - ID of the tab to activate.
 * @throws {AppError} If the browser API call fails.
 */
async function tabsUpdate(tabId: number): Promise<browser.tabs.Tab> {
    try {
        return await browser.tabs.update(tabId, {
            active: true
        });
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.F.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {tabId, originalError: serializeError(err)}
        );
    }
}

/**
 * Brings a specific window into focus.
 *
 * @param windowId - ID of the window to focus.
 * @throws {AppError} If the browser API call fails.
 */
async function windowsUpdate(
    windowId: number
): Promise<browser.windows.Window> {
    try {
        return await browser.windows.update(windowId, {
            focused: true
        });
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.E.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {windowId, originalError: serializeError(err)}
        );
    }
}

/**
 * Downloads a string buffer as a JSON file via the browser downloads API.
 * Revokes the object URL automatically once the download completes.
 *
 * @param buffer - The string content to save.
 * @param filename - The target filename.
 * @throws {AppError} If the filename is empty or the browser API call fails.
 */
async function writeBufferToFile(
    buffer: string,
    filename: string
): Promise<void> {
    if (!filename || filename.trim() === "") {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.I.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    try {
        const blob = new Blob([buffer], {type: "application/json"});
        const blobUrl = URL.createObjectURL(blob);

        await browser.downloads.download({
            url: blobUrl,
            filename
        });

        const onDownloadChange = (
            change: browser.downloads._OnChangedDownloadDelta
        ): void => {
            if (
                change.state?.current === COMPLETE ||
                change.state?.current === INTERRUPTED
            ) {
                URL.revokeObjectURL(blobUrl);
                browser.downloads.onChanged.removeListener(onDownloadChange);
            }
        };

        browser.downloads.onChanged.addListener(onDownloadChange);
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.J.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {filename, originalError: serializeError(err)}
        );
    }
}
