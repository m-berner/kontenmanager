/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {AppError, ERROR_CATEGORY, ERROR_CODES, isAppError} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import deNotifications from "@/_locales/de/messages.json";
import type {EventTypes} from "@/types";
import {alertService} from "@/services/alert";

const APP_URL = "entrypoints/app.html";
const APP_TITLE = "KontenManager";
const COMPLETE: EventTypes = "complete";

/** The 5-character locale code (e.g., 'en-US', 'de-DE'). */
function locale5() {
    const defaultLanguage = `${navigator.languages[0]}`;

    if (defaultLanguage.length === 5) {
        return defaultLanguage;
    }

    if (defaultLanguage.length === 2) {
        return `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
    }

    throw AppError("xx_browser_language", ERROR_CATEGORY.BROWSER_API, true);
}

/** The current extension manifest. */
export function manifest() {
    return browser.runtime.getManifest()
}

/**
 * Gets a translated message.
 *
 * @param code string - Message code.
 * @returns A promise resolving to the translated message.
 */
export function getMessage(code: keyof typeof deNotifications): string {
    return code in deNotifications
        ? browser.i18n.getMessage(code)
        : browser.i18n.getMessage("xx_error_code");
}

/**
 * Gets the user locale with fallback to en-US on error
 */
export function getUserLocale(): "de-DE" | "en-US" {
    try {
        const userLocale = locale5();

        if (userLocale === "de-DE" || userLocale === "en-US") {
            return userLocale;
        }
        return "en-US";
    } catch (err) {
        alertService.feedbackError("Plugins i18n", err, {}).then();
        return "en-US";
    }
}

/**
 * Registers a listener for the extension action button click.
 * @param listener - Callback function.
 */
export function actionOnClicked(
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
export function runtimeOnInstalled(
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
export async function tabsCreate(): Promise<browser.tabs.Tab> {
    try {
        return await browser.tabs.create({
            url: browser.runtime.getURL(APP_URL),
            active: true
        });
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.C,
            ERROR_CATEGORY.VALIDATION,
            true
        );
    }
}

/**
 * Queries for existing extension tabs.
 * @returns A promise resolving to an array of matching tabs.
 */
export async function tabsQuery(): Promise<browser.tabs.Tab[]> {
    try {
        return await browser.tabs.query({url: browser.runtime.getURL(APP_URL)});
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.D,
            ERROR_CATEGORY.VALIDATION,
            true
        );
    }
}

/**
 * Focuses a specific window.
 * @param windowId - ID of the window to focus.
 */
export async function windowsUpdate(
    windowId: number
): Promise<browser.windows.Window> {
    try {
        return await browser.windows.update(windowId, {
            focused: true
        });
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.E,
            ERROR_CATEGORY.VALIDATION,
            true
        );
    }
}

/**
 * Activates a specific tab.
 * @param tabId - ID of the tab to activate.
 */
export async function tabsUpdate(tabId: number): Promise<browser.tabs.Tab> {
    try {
        return await browser.tabs.update(tabId, {
            active: true
        });
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.F,
            ERROR_CATEGORY.VALIDATION,
            true
        );
    }
}

/**
 * Removes a specific tab off the UI.
 * @param tabId - ID of the tab to remove.
 */
export async function removeTab(tabId: number): Promise<void> {
    try {
        await browser.tabs.remove(tabId);
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.F,
            ERROR_CATEGORY.VALIDATION,
            true
        );
    }
}

/**
 * Opens the extension's options page.
 */
export async function openOptionsPage(): Promise<void> {
    try {
        await browser.runtime.openOptionsPage();
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.G,
            ERROR_CATEGORY.VALIDATION,
            true
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
export async function showSystemNotification(
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
    } catch {
        log("SERVICES browserService: Notification failed", {}, "error");
    }
}

/**
 * Downloads a string buffer as a JSON file.
 * @param buffer - The string content to save.
 * @param filename - The target filename.
 */
export async function writeBufferToFile(
    buffer: string,
    filename: string
): Promise<void> {
    if (!filename || filename.trim() === "") {
        throw AppError(
            ERROR_CODES.USE_BROWSER.I,
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
    } catch {
        throw AppError(
            ERROR_CODES.USE_BROWSER.J,
            ERROR_CATEGORY.VALIDATION,
            true
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
