/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError,} from "@/domain/errors";
import type {EventTypes} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const APP_URL = "adapters/ui/entrypoints/app.html";
const APP_TITLE = "KontenManager";
/**
 * Extension-root-relative path to the notification icon, resolved through
 * `browser.runtime.getURL` at every use.
 *
 * It used to be the bare string `"assets/icon64.png"`, and a relative
 * `iconUrl` resolves against the *calling document's* URL, not the extension
 * root. The only production caller (`useImportDialog`) runs in `app.html`,
 * which lives at `adapters/ui/entrypoints/`, so the icon resolved to
 * `adapters/ui/entrypoints/assets/icon64.png` — a path that does not exist in
 * the build. `manifest.json` references this icon three times and always with
 * the full `adapters/ui/assets/` prefix; the build has no `assets/` directory
 * at its root at all.
 *
 * That mattered because Firefox may reject `notifications.create` outright on
 * an unresolvable `iconUrl`, and the surrounding `try/catch` logs and swallows
 * the failure — while this notification is the *only* feedback the import
 * dialog gives for a rejected file (empty, over 64 MB, or not `.json`). The
 * file would vanish from the picker with nothing said.
 */
const NOTIFICATION_ICON_PATH = "adapters/ui/assets/icon64.png";
const COMPLETE: EventTypes = "complete";
const INTERRUPTED: EventTypes = "interrupted";
/**
 * Upper bound on how long an export's blob URL may stay alive waiting for a
 * terminal download state. See `writeBufferToFile`.
 */
const MAX_DOWNLOAD_LIFETIME_MS = 10 * 60 * 1000;

export type BrowserAdapter = ReturnType<typeof createBrowserAdapter>;

export function createBrowserAdapter() {
    return {
        actionOnClicked,
        getMessage,
        getUserLocale,
        isAppTabUrl,
        manifest,
        openOptionsPage,
        removeTab,
        runtimeOnInstalled,
        showSystemNotification,
        tabsCreate,
        tabsGetCurrent,
        tabsOnCreated,
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
 * Maps the browser locale onto one of the two shipped UI locales
 * ("de-DE", "en-US"), falling back to "en-US".
 *
 * Matches on the **language subtag**, not the full tag. Matching the full tag
 * meant only the two exact strings survived, so every German locale that is not
 * Germany — `de-AT`, `de-CH` — fell through to `en-US`. That is not merely an
 * English UI: this value is also what selects the i18n `numberFormats` entry, so
 * `n(value, "currency")` resolved to USD and an Austrian user's euro balance
 * rendered as `$1,234.56` across the title bar, the bookings table and the
 * accounting dialog. The stored data and the arithmetic were never affected —
 * only every money label in a banking extension.
 *
 * The old behaviour was also self-contradictory: `locale5` expands a bare `de`
 * to `de-DE`, so a browser reporting plain `de` got the German UI while `de-AT`
 * — strictly more information about the same language — did not.
 */
function getUserLocale(): "de-DE" | "en-US" {
    try {
        const language = locale5().slice(0, 2).toLowerCase();

        return language === "de" ? "de-DE" : "en-US";
    } catch (err) {
        // Keep this service independent of UI/Pinia/alerts.
        log("SERVICES browserAdapter: getUserLocale fallback", err, "warn");
        return "en-US";
    }
}

/**
 * Returns whether the given URL is the extension's main app page — used to
 * tell an app tab apart from any other tab (e.g. the options page, or an
 * unrelated site) without exposing the raw `APP_URL` constant itself.
 *
 * The `#fragment` is stripped before comparing. The router uses
 * `createWebHashHistory()` (plugins/router.ts), so an app tab's URL becomes
 * `…/app.html#/company` as soon as the user navigates anywhere — a strict
 * equality check against the bare URL then failed for every app tab except a
 * freshly-loaded one. That silently disabled `background.ts`'s
 * `tabs.onCreated` fast path, whose whole purpose is to close a native
 * "Duplicate Tab" result immediately instead of waiting for the duplicate to
 * boot and run `ensureSingleAppTab()`.
 *
 * This also aligns the two checks: `tabsQuery()` passes the same URL to
 * `browser.tabs.query({url})`, where it is treated as a *match pattern* and
 * the fragment is ignored — so that path already matched navigated app tabs
 * while this one did not.
 *
 * @param url - The tab URL to check, if known (may be `undefined` for a
 *   brand-new tab whose navigation hasn't committed yet).
 */
function isAppTabUrl(url: string | undefined): boolean {
    if (url === undefined) return false;
    const withoutFragment = url.split("#")[0];
    return withoutFragment === browser.runtime.getURL(APP_URL);
}

/**
 * Returns the current extension manifest.
 */
function manifest() {
    return browser.runtime.getManifest()
}

/**
 * Opens the extension's option page.
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
            ERROR_DEFINITIONS.USE_BROWSER.K.CODE,
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
            // Only an i18n message NAME goes to getMessage. A "#"-prefixed code
            // comes from ERROR_DEFINITIONS and is not a _locales key, so asking
            // for it produced an invalid-message-name warning on the console
            // that looked like a missing translation but was not one — and the
            // answer was always "" anyway, falling through to `.message`, which
            // appError() had already resolved from the same table.
            //
            // Same prefix test appError() itself uses to decide between the
            // definitions table and i18n (domain/errors.ts).
            const code = String(messageOrError.code);
            let msg = code.startsWith("#") ? "" : browser.i18n.getMessage(code);
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
                iconUrl: browser.runtime.getURL(NOTIFICATION_ICON_PATH),
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
 * Returns the tab this script is currently running in, or `undefined` if
 * it isn't running inside an identifiable tab (e.g. a background context).
 *
 * @throws {AppError} If the browser API call fails.
 */
async function tabsGetCurrent(): Promise<browser.tabs.Tab | undefined> {
    try {
        return await browser.tabs.getCurrent();
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.L.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * Registers a listener for new tab creation, across every tab in the
 * browser (not just this extension's own).
 *
 * @param listener - Called with the newly created tab.
 */
function tabsOnCreated(listener: (_tab: browser.tabs.Tab) => void): void {
    browser.tabs.onCreated.addListener(listener);
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

    const blob = new Blob([buffer], {type: "application/json"});
    const blobUrl = URL.createObjectURL(blob);

    // The listener is registered BEFORE starting the download. Registering it
    // after awaiting `downloads.download()` meant a download that reached a
    // terminal state first — plausible for a small backup on a fast local disk
    // — was never observed, so the blob URL (holding the entire serialized
    // database in memory) was never revoked and the listener stayed attached
    // for the lifetime of the background page, once per export.
    //
    // Because the id isn't known yet at that point, terminal states seen before
    // it resolves are remembered and re-checked once it does.
    let downloadId: number | undefined;
    let finished = false;
    const terminalBeforeIdKnown = new Set<number>();

    // Backstop for the case the listener cannot cover: a download that never
    // reaches a terminal state at all — paused and never resumed, or still in
    // progress when the page goes away. `cleanup` previously ran only from
    // `onDownloadChange` (on complete/interrupted) or from the catch below, so
    // those left the blob URL alive holding the ENTIRE serialized database in
    // memory, with the listener attached for the page's lifetime, once per
    // export.
    //
    // The timeout is deliberately generous. A blob URL is local — the browser
    // reads it off the object store, not the network — so a download still
    // unresolved after this long is stuck rather than slow. Revoking it would
    // break resuming a genuinely paused download, which is the trade-off: an
    // unusable stale URL versus an unbounded leak of a multi-megabyte buffer.
    const cleanup = (): void => {
        if (finished) return;
        finished = true;
        clearTimeout(lifetimeTimer);
        globalThis.removeEventListener?.("pagehide", onPageHide);
        URL.revokeObjectURL(blobUrl);
        browser.downloads.onChanged.removeListener(onDownloadChange);
    };

    function onPageHide(): void {
        cleanup();
    }

    function onDownloadChange(
        change: browser.downloads._OnChangedDownloadDelta
    ): void {
        const isTerminal =
            change.state?.current === COMPLETE ||
            change.state?.current === INTERRUPTED;
        if (!isTerminal) return;

        // Only react to this call's own download — the listener fires for every
        // download in the browser, and reacting to another one would revoke this
        // blob URL while its download is still in flight.
        if (downloadId === undefined) {
            terminalBeforeIdKnown.add(change.id);
            return;
        }
        if (change.id === downloadId) cleanup();
    }

    const lifetimeTimer = setTimeout(() => {
        log(
            "SERVICES browser: download never reached a terminal state; releasing blob URL",
            {filename, downloadId},
            "warn"
        );
        cleanup();
    }, MAX_DOWNLOAD_LIFETIME_MS);

    browser.downloads.onChanged.addListener(onDownloadChange);
    globalThis.addEventListener?.("pagehide", onPageHide);

    try {
        downloadId = await browser.downloads.download({
            url: blobUrl,
            filename
        });
        if (terminalBeforeIdKnown.has(downloadId)) cleanup();
    } catch (err) {
        cleanup();
        throw appError(
            ERROR_DEFINITIONS.USE_BROWSER.J.CODE,
            ERROR_CATEGORY.BROWSER_API,
            true,
            {filename, originalError: serializeError(err)}
        );
    }
}
