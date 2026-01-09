import { computed } from 'vue';
import { useAppConfig } from '@/composables/useAppConfig';
import { useDialogGuards } from '@/composables/useDialogGuards';
const { BROWSER_STORAGE, EVENTS, PAGES, SYSTEM } = useAppConfig();
const { handleError } = useDialogGuards();
export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(PAGES.INDEX));
    const manifest = computed(() => browser.runtime.getManifest());
    const uiLanguage = computed(() => browser.i18n.getUILanguage());
    const locale5 = computed(() => {
        const defaultLanguage = navigator.languages[0];
        if (!defaultLanguage) {
            throw new Error(`${SYSTEM.ERRORS.LOCALE5}: No language available`);
        }
        if (defaultLanguage.length === 5) {
            return defaultLanguage;
        }
        if (defaultLanguage.length === 2) {
            return `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
        }
        throw new Error(`${SYSTEM.ERRORS.LOCALE5}: Invalid language format "${defaultLanguage}"`);
    });
    function actionOnClicked(listener) {
        browser.action.onClicked.addListener(listener);
    }
    function runtimeOnInstalled(listener) {
        browser.runtime.onInstalled.addListener(listener);
    }
    async function clearStorage() {
        try {
            await browser.storage.local.clear();
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.STORAGE_LOCAL, err);
        }
    }
    async function tabsCreate() {
        try {
            return await browser.tabs.create({
                url: indexUrl.value,
                active: true
            });
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.TABS, err);
        }
    }
    async function tabsQuery() {
        try {
            return await browser.tabs.query({ url: indexUrl.value });
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.TABS, err);
        }
    }
    async function windowsUpdate(windowId) {
        try {
            return await browser.windows.update(windowId, {
                focused: true
            });
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.WINDOWS, err);
        }
    }
    async function tabsUpdate(tabId) {
        try {
            return await browser.tabs.update(tabId, {
                active: true
            });
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.TABS, err);
        }
    }
    async function setStorage(key, value) {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.STORAGE_LOCAL, err);
        }
    }
    async function getStorage(keys = null) {
        try {
            return await browser.storage.local.get(keys);
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.STORAGE_LOCAL, err);
        }
    }
    function addStorageChangedListener(callback) {
        const wrappedCallback = (changes, areaName) => {
            if (areaName === 'local') {
                callback(changes, areaName);
            }
        };
        browser.storage.onChanged.addListener(wrappedCallback);
        return () => browser.storage.onChanged.removeListener(wrappedCallback);
    }
    async function installStorageLocal() {
        try {
            const storageLocal = await browser.storage.local.get();
            const updates = {};
            for (const value of Object.values(BROWSER_STORAGE)) {
                if (storageLocal[value.key] === undefined) {
                    updates[value.key] = value.value;
                }
            }
            if (Object.keys(updates).length > 0) {
                await browser.storage.local.set(updates);
            }
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.STORAGE_LOCAL, err);
        }
    }
    async function openOptionsPage() {
        try {
            await browser.runtime.openOptionsPage();
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.OPEN_OPTIONS, err);
        }
    }
    async function notice(messages) {
        try {
            const notificationOption = {
                type: 'basic',
                iconUrl: 'assets/icon16.png',
                title: SYSTEM.TITLE,
                message: messages.join('\n')
            };
            await browser.notifications.create(notificationOption);
        }
        catch (err) {
            throw handleError(SYSTEM.ERRORS.NOTICE, err);
        }
    }
    async function writeBufferToFile(buffer, filename) {
        if (!filename || filename.trim() === '') {
            throw handleError(SYSTEM.ERRORS.WRITE_BUFFER_TO_FILE, new Error('Invalid filename'));
        }
        try {
            const blob = new Blob([buffer], { type: 'application/json' });
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
            throw handleError(SYSTEM.ERRORS.WRITE_BUFFER_TO_FILE, err);
        }
    }
    return {
        locale5,
        manifest,
        uiLanguage,
        actionOnClicked,
        runtimeOnInstalled,
        clearStorage,
        getStorage,
        setStorage,
        installStorageLocal,
        notice,
        addStorageChangedListener,
        openOptionsPage,
        tabsCreate,
        tabsQuery,
        tabsUpdate,
        windowsUpdate,
        writeBufferToFile
    };
}
