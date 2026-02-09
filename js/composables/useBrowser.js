import { computed } from "vue";
import { EVENTS } from "@/config/events";
import { ENTRYPOINTS } from "@/config/entrypoints";
import { DEFAULTS } from "@/config/defaults";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import deNotifications from "@/_locales/de/messages.json";
export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(ENTRYPOINTS.APP));
    const manifest = computed(() => browser.runtime.getManifest());
    const locale5 = computed(() => {
        const defaultLanguage = `${navigator.languages[0]}`;
        if (defaultLanguage.length === 5) {
            return defaultLanguage;
        }
        if (defaultLanguage.length === 2) {
            return `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
        }
        throw new AppError("xx_browser_language", ERROR_CATEGORY.BROWSER_API, true);
    });
    function getUserLocale() {
        try {
            const userLocale = locale5.value;
            if (userLocale === "de-DE" || userLocale === "en-US") {
                return userLocale;
            }
            return "en-US";
        }
        catch (err) {
            handleUserNotice("Plugins i18n", err).then();
            return "en-US";
        }
    }
    function actionOnClicked(listener) {
        browser.action.onClicked.addListener(listener);
    }
    function runtimeOnInstalled(listener) {
        browser.runtime.onInstalled.addListener(listener);
    }
    async function tabsCreate() {
        try {
            return await browser.tabs.create({
                url: indexUrl.value,
                active: true
            });
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.C, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function tabsQuery() {
        try {
            return await browser.tabs.query({ url: indexUrl.value });
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.D, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function windowsUpdate(windowId) {
        try {
            return await browser.windows.update(windowId, {
                focused: true
            });
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.E, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function tabsUpdate(tabId) {
        try {
            return await browser.tabs.update(tabId, {
                active: true
            });
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.F, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function removeTab(tabId) {
        try {
            await browser.tabs.remove(tabId);
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.F, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function openOptionsPage() {
        try {
            await browser.runtime.openOptionsPage();
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.G, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    function getMessage(code) {
        return code in deNotifications
            ? browser.i18n.getMessage(code)
            : browser.i18n.getMessage("xx_error_code");
    }
    async function handleUserNotice(mod, messageOrError) {
        try {
            let messages = [];
            if (messageOrError instanceof AppError) {
                let msg = browser.i18n.getMessage(messageOrError.code);
                if (msg === "") {
                    msg = messageOrError.message;
                }
                messages = [`${mod}: ${messageOrError._category}`, msg];
            }
            else if (messageOrError instanceof Error) {
                messages = [mod, messageOrError.name, messageOrError.message];
            }
            else if (typeof messageOrError === "string") {
                messages = [mod, messageOrError];
            }
            else if (Array.isArray(messageOrError)) {
                messages = [mod, ...messageOrError];
            }
            else {
                messages = [mod, "Unknown user message"];
            }
            const notificationOption = {
                type: "basic",
                iconUrl: "assets/icon64.png",
                title: DEFAULTS.TITLE,
                message: messages.join("\n")
            };
            await browser.notifications.create(notificationOption);
        }
        catch {
            DomainUtils.log("Notification failed", {}, "error");
        }
    }
    async function writeBufferToFile(buffer, filename) {
        if (!filename || filename.trim() === "") {
            throw new AppError(ERROR_CODES.USE_BROWSER.I, ERROR_CATEGORY.VALIDATION, false);
        }
        try {
            const blob = new Blob([buffer], { type: "application/json" });
            const blobUrl = URL.createObjectURL(blob);
            await browser.downloads.download({
                url: blobUrl,
                filename
            });
            const onDownloadChange = (change) => {
                if (change.state?.current === EVENTS.COMPLETE) {
                    URL.revokeObjectURL(blobUrl);
                    browser.downloads.onChanged.removeListener(onDownloadChange);
                }
            };
            browser.downloads.onChanged.addListener(onDownloadChange);
        }
        catch {
            throw new AppError(ERROR_CODES.USE_BROWSER.J, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    return {
        manifest,
        actionOnClicked,
        getMessage,
        getUserLocale,
        runtimeOnInstalled,
        removeTab,
        handleUserNotice,
        openOptionsPage,
        tabsCreate,
        tabsQuery,
        tabsUpdate,
        windowsUpdate,
        writeBufferToFile
    };
}
DomainUtils.log("COMPOSABLE useBrowser");
