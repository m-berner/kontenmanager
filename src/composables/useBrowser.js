import { useConstant } from '@/composables/useConstant';
export const useBrowser = () => {
    const clearStorage = async () => {
        await browser.storage.local.clear();
    };
    const setStorage = async (key, value) => {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch (error) {
            throw error;
        }
    };
    const getStorage = async (keys = null) => {
        try {
            return await browser.storage.local.get(keys);
        }
        catch (error) {
            throw error;
        }
    };
    const openOptionsPage = async () => {
        try {
            return await browser.runtime.openOptionsPage();
        }
        catch (error) {
            throw error;
        }
    };
    const onStorageChanged = (callback) => {
        browser.storage.local.onChanged.addListener(callback);
        return () => browser.storage.local.onChanged.removeListener(callback);
    };
    const getChar5Locale = () => {
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
    };
    const installStorageLocal = async () => {
        const { CONS } = useConstant();
        const storageLocal = await browser.storage.local.get();
        if (storageLocal[CONS.STORAGE.PROPS.SKIN] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.SKIN]: CONS.DEFAULTS.STORAGE.SKIN });
        }
        if (storageLocal[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID });
        }
        if (storageLocal[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE]: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE });
        }
        if (storageLocal[CONS.STORAGE.PROPS.STOCKS_PER_PAGE] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.STOCKS_PER_PAGE]: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE });
        }
        if (storageLocal[CONS.STORAGE.PROPS.PARTNER] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.PARTNER]: CONS.DEFAULTS.STORAGE.PARTNER });
        }
        if (storageLocal[CONS.STORAGE.PROPS.SERVICE] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.SERVICE]: CONS.DEFAULTS.STORAGE.SERVICE });
        }
        if (storageLocal[CONS.STORAGE.PROPS.EXCHANGES] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.EXCHANGES]: CONS.DEFAULTS.STORAGE.EXCHANGES });
        }
        if (storageLocal[CONS.STORAGE.PROPS.INDEXES] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.INDEXES]: CONS.DEFAULTS.STORAGE.INDEXES });
        }
        if (storageLocal[CONS.STORAGE.PROPS.MARKETS] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.MARKETS]: CONS.DEFAULTS.STORAGE.MARKETS });
        }
        if (storageLocal[CONS.STORAGE.PROPS.MATERIALS] === undefined) {
            await browser.storage.local.set({ [CONS.STORAGE.PROPS.MATERIALS]: CONS.DEFAULTS.STORAGE.MATERIALS });
        }
    };
    return {
        clearStorage,
        getChar5Locale,
        getStorage,
        setStorage,
        installStorageLocal,
        onStorageChanged,
        openOptionsPage
    };
};
