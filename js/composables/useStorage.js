import { AppError } from '@/domains/errors';
import { BROWSER_STORAGE } from '@/config/storage';
import { SYSTEM } from '@/domains/config/system';
export function useStorage() {
    async function clearStorage() {
        try {
            await browser.storage.local.clear();
        }
        catch (err) {
            throw new AppError(SYSTEM.ERRORS.STORAGE_LOCAL, 'USE_STORAGE', SYSTEM.ERROR_CATEGORY.VALIDATION, { b: err }, true);
        }
    }
    async function setStorage(key, value) {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch (err) {
            throw new AppError(SYSTEM.ERRORS.STORAGE_LOCAL, 'USE_STORAGE', SYSTEM.ERROR_CATEGORY.VALIDATION, { b: err }, true);
        }
    }
    async function getStorage(keys = null) {
        try {
            return await browser.storage.local.get(keys);
        }
        catch (err) {
            throw new AppError(SYSTEM.ERRORS.STORAGE_LOCAL, 'USE_STORAGE', SYSTEM.ERROR_CATEGORY.VALIDATION, { b: err }, true);
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
            throw new AppError(SYSTEM.ERRORS.STORAGE_LOCAL, 'USE_STORAGE', SYSTEM.ERROR_CATEGORY.VALIDATION, { b: err }, true);
        }
    }
    return {
        clearStorage,
        getStorage,
        setStorage,
        addStorageChangedListener,
        installStorageLocal
    };
}
