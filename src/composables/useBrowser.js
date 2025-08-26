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
    return { setStorage };
};
