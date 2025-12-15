import { useApp } from '@/composables/useApp';
import { computed } from 'vue';
import { useRecordsStore } from '@/stores/records';
const { CONS } = useApp();
export function useBrowser() {
    const indexUrl = computed(() => browser.runtime.getURL(CONS.PAGES.INDEX));
    const manifest = computed(() => browser.runtime.getManifest());
    const uiLanguage = computed(() => browser.i18n.getUILanguage());
    const locale5 = computed(() => {
        const defaultLanguage = navigator.languages[0];
        let result = '';
        if (defaultLanguage.length === 5) {
            result = defaultLanguage;
        }
        else if (defaultLanguage.length === 2) {
            result = `${defaultLanguage}-${defaultLanguage.toUpperCase()}`;
        }
        else {
            throw new Error('Could not read the browser language!');
        }
        return result;
    });
    function actionOnClicked(listener) {
        browser.action.onClicked.addListener(listener);
    }
    function runtimeOnInstalled(listener) {
        browser.runtime.onInstalled.addListener(listener);
    }
    async function clearStorage() {
        await browser.storage.local.clear();
    }
    async function tabsCreate() {
        return await browser.tabs.create({
            url: indexUrl.value,
            active: true
        });
    }
    async function tabsQuery() {
        return await browser.tabs.query({ url: indexUrl.value });
    }
    async function windowsUpdate(wId) {
        return await browser.windows.update(wId ?? 0, {
            focused: true
        });
    }
    async function tabsUpdate(id) {
        return await browser.tabs.update(id ?? 0, {
            active: true
        });
    }
    async function setStorage(key, value) {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch (error) {
            throw error;
        }
    }
    async function getStorage(keys = null) {
        try {
            return await browser.storage.local.get(keys);
        }
        catch (error) {
            throw error;
        }
    }
    function addStorageChangedListener(callback) {
        browser.storage.local.onChanged.addListener(callback);
        return () => browser.storage.local.onChanged.removeListener(callback);
    }
    async function installStorageLocal() {
        const records = useRecordsStore();
        const storageLocal = await browser.storage.local.get();
        if (storageLocal[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
            const activeId = records.accounts.items.length > 0
                ? records.accounts.items[0].cID
                : CONS.DEFAULTS.BROWSER_STORAGE.ACTIVE_ACCOUNT_ID;
            await browser.storage.local.set({ [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: activeId });
        }
        const defaults = {
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN]: CONS.DEFAULTS.BROWSER_STORAGE.SKIN,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUMS_PER_PAGE]: CONS.DEFAULTS.BROWSER_STORAGE.SUMS_PER_PAGE,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE]: CONS.DEFAULTS.BROWSER_STORAGE.SERVICE,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES]: CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES]: CONS.DEFAULTS.BROWSER_STORAGE.INDEXES,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS]: CONS.DEFAULTS.BROWSER_STORAGE.MARKETS,
            [CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS]: CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS
        };
        for (const [key, value] of Object.entries(defaults)) {
            if (storageLocal[key] === undefined) {
                await browser.storage.local.set({ [key]: value });
            }
        }
        return storageLocal;
    }
    async function openOptionsPage() {
        try {
            return await browser.runtime.openOptionsPage();
        }
        catch (error) {
            throw error;
        }
    }
    async function notice(messages) {
        const msg = messages.join('\n');
        const notificationOption = {
            type: 'basic',
            iconUrl: 'assets/icon16.png',
            title: 'KontenManager',
            message: msg
        };
        await browser.notifications.create(notificationOption);
    }
    async function writeBufferToFile(buffer, fn) {
        const blob = new Blob([buffer], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        const op = {
            url: blobUrl,
            filename: fn
        };
        await browser.downloads.download(op);
        await notice(['Database exported!']);
        const onDownloadChange = (change) => {
            if ((change.state !== undefined && change.id > 0) || (change.state !== undefined && change.state.current === CONS.EVENTS.COMPLETE)) {
                URL.revokeObjectURL(blobUrl);
                browser.downloads.onChanged.removeListener(onDownloadChange);
            }
        };
        browser.downloads.onChanged.addListener(onDownloadChange);
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
