export const useBrowser = () => {
    const setStorage = async (key, value) => {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch (error) {
            console.error('Storage update failed:', error);
            throw error;
        }
    };
    const getStorage = async (keys = []) => {
        try {
            return await browser.storage.local.get(keys);
        }
        catch (error) {
            console.error('Storage get failed:', error);
            throw error;
        }
    };
    const openOptionsPage = async () => {
        return browser.runtime.openOptionsPage();
    };
    const sendMessage = (message) => {
        return browser.runtime.sendMessage(JSON.stringify(message));
    };
    const onStorageChanged = (callback) => {
        browser.storage.local.onChanged.addListener(callback);
        return () => browser.storage.local.onChanged.removeListener(callback);
    };
    return { getStorage, sendMessage, setStorage, onStorageChanged, openOptionsPage };
};
