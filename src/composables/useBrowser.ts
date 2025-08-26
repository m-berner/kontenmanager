
export const useBrowser = ()=> {
    const setStorage = async (key: string, value: string | number | boolean | string[]): Promise<void> => {
        try {
            await browser.storage.local.set({ [key]: value })
        } catch (error) {
            console.error('Storage update failed:', error)
            throw error
        }
    }
    const getStorage = async (keys: string[] = []): Promise<{ [p: string]: string | boolean |  number | string[] }> => {
        try {
            return await browser.storage.local.get(keys)
        } catch (error) {
            console.error('Storage get failed:', error)
            throw error
        }
    }
    const openOptionsPage = async (): Promise<void> => {
        return browser.runtime.openOptionsPage()
    }
    const sendMessage = (message: string) => {
        return browser.runtime.sendMessage(JSON.stringify(message))
    }
    const onStorageChanged = (callback: (changes: browser.storage.StorageChange) => void) => {
        browser.storage.local.onChanged.addListener(callback)
        // Return cleanup function
        return () => browser.storage.local.onChanged.removeListener(callback)
    }

    return { getStorage, sendMessage, setStorage, onStorageChanged, openOptionsPage }
}