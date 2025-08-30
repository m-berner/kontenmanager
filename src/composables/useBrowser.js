export const useBrowser = () => {
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
    return { getChar5Locale, getStorage, setStorage, onStorageChanged, openOptionsPage };
};
