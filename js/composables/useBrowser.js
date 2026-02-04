import { computed } from "vue";
import { EVENTS } from "@/config/events";
import { ENTRYPOINTS } from "@/config/entrypoints";
import { DEFAULTS } from "@/config/defaults";
import { AppError, ERROR_CATEGORY, ERROR_CODES, serializeError } from "@/domains/errors";
export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(ENTRYPOINTS.APP));
    const manifest = computed(() => browser.runtime.getManifest());
    const uiLanguage = computed(() => browser.i18n.getUILanguage());
    const locale5 = computed(() => {
        const defaultLanguage = navigator.languages[0];
        if (!defaultLanguage) {
            throw new AppError(ERROR_CODES.USE_BROWSER.A, ERROR_CATEGORY.VALIDATION, {}, false);
        }
        if (defaultLanguage.length === 5) {
            return defaultLanguage;
        }
        if (defaultLanguage.length === 2) {
            return `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
        }
        throw new AppError(ERROR_CODES.USE_BROWSER.B, ERROR_CATEGORY.VALIDATION, { input: "invalid_lang_format" }, false);
    });
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
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.C, ERROR_CATEGORY.VALIDATION, { input: serializeError(err) }, true);
        }
    }
    async function tabsQuery() {
        try {
            return await browser.tabs.query({ url: indexUrl.value });
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.D, ERROR_CATEGORY.VALIDATION, { input: serializeError(err) }, true);
        }
    }
    async function windowsUpdate(windowId) {
        try {
            return await browser.windows.update(windowId, {
                focused: true
            });
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.E, ERROR_CATEGORY.VALIDATION, { input: serializeError(err), windowId }, true);
        }
    }
    async function tabsUpdate(tabId) {
        try {
            return await browser.tabs.update(tabId, {
                active: true
            });
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.F, ERROR_CATEGORY.VALIDATION, { input: serializeError(err), tabId }, true);
        }
    }
    async function removeTab(tabId) {
        try {
            await browser.tabs.remove(tabId);
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.F, ERROR_CATEGORY.VALIDATION, { input: serializeError(err), tabId }, true);
        }
    }
    async function openOptionsPage() {
        try {
            await browser.runtime.openOptionsPage();
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.G, ERROR_CATEGORY.VALIDATION, { input: serializeError(err) }, true);
        }
    }
    async function notice(messages) {
        try {
            const notificationOption = {
                type: "basic",
                iconUrl: "assets/icon16.png",
                title: DEFAULTS.TITLE,
                message: messages.join("\n")
            };
            await browser.notifications.create(notificationOption);
        }
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.H, ERROR_CATEGORY.VALIDATION, { input: serializeError(err), messages }, true);
        }
    }
    async function writeBufferToFile(buffer, filename) {
        if (!filename || filename.trim() === "") {
            throw new AppError(ERROR_CODES.USE_BROWSER.I, ERROR_CATEGORY.VALIDATION, { input: filename }, false);
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
        catch (err) {
            throw new AppError(ERROR_CODES.USE_BROWSER.J, ERROR_CATEGORY.VALIDATION, { input: serializeError(err), filename }, true);
        }
    }
    return {
        locale5,
        manifest,
        uiLanguage,
        actionOnClicked,
        runtimeOnInstalled,
        removeTab,
        notice,
        openOptionsPage,
        tabsCreate,
        tabsQuery,
        tabsUpdate,
        windowsUpdate,
        writeBufferToFile
    };
}
