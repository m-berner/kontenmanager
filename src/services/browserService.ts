/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import deNotifications from "@/_locales/de/messages.json";
import type {EventTypes} from "@/types";
import {alertService} from "@/services/alert";
import {ERROR_CATEGORY} from "@/constants";

const APP_URL = "entrypoints/app.html";
const APP_TITLE = "KontenManager";
const COMPLETE: EventTypes = "complete";

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

    throw appError("xx_browser_language", ERROR_CATEGORY.BROWSER_API, true);
}

/**
 * Returns the current extension manifest.
 *
 * @returns The extension manifest object.
 */
function manifest() {
    return browser.runtime.getManifest()
}

/**
 * Gets a translated message.
 *
 * @param code string - Message code.
 * @returns A promise resolving to the translated message.
 */
function getMessage(code: string): string {
    return code in deNotifications
        ? browser.i18n.getMessage(code)
        : browser.i18n.getMessage("xx_error_code");
}

/**
 * Gets the user locale with fallback to en-US on error.
 *
 * @returns Either "de-DE" or "en-US".
 */
function getUserLocale(): "de-DE" | "en-US" {
    try {
        const userLocale = locale5();

        if (userLocale === "de-DE" || userLocale === "en-US") {
            return userLocale;
        }
        return "en-US";
    } catch (err) {
        void alertService.feedbackError("Plugins i18n", err, {}).catch(() => {
            // Avoid unhandled promise rejections; locale fallback must succeed.
        });
        return "en-US";
    }
}

/**
 * Registers a listener for the extension action button click.
 * @param listener - Callback function.
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
 * Registers a listener for extension installation or update.
 * @param listener - Async callback function.
 */
function runtimeOnInstalled(
    listener: (
        _details: browser.runtime._OnInstalledDetails | undefined
    ) => Promise<void>
): void {
    browser.runtime.onInstalled.addListener(listener);
}

/**
 * Creates a new tab with the extension's main page.
 * @returns A promise resolving to the created tab.
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
 * Queries for existing extension tabs by their internal URL.
 *
 * @returns A promise resolving to an array of matching tabs.
 * @throws {AppError} If the query fails.
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
 * Focuses a specific window.
 * @param windowId - ID of the window to focus.
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
 * Activates a specific tab.
 * @param tabId - ID of the tab to activate.
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
 * Removes a specific tab off the UI.
 * @param tabId - ID of the tab to remove.
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
 * Opens the extension's options page.
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
 * Displays a browser notification.
 * Best for background processes or system-level alerts.
 * For foreground UI feedback, prefer `useAlert`.
 *
 * @param mod - Module name that catch the error.
 * @param messageOrError - Array of message lines.
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
            "SERVICES browserService: Notification failed",
            {error: serializeError(err)},
            "error"
        );
    }
}

/**
 * Downloads a string buffer as a JSON file.
 * @param buffer - The string content to save.
 * @param filename - The target filename.
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
            if (change.state?.current === COMPLETE) {
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

// Export as a singleton instance
export const browserService = {
    manifest,
    getMessage,
    getUserLocale,
    actionOnClicked,
    runtimeOnInstalled,
    tabsCreate,
    tabsQuery,
    windowsUpdate,
    tabsUpdate,
    removeTab,
    openOptionsPage,
    showSystemNotification,
    writeBufferToFile
};
