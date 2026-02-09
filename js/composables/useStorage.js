import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { DomainUtils } from "@/domains/utils";
export function useStorage() {
    async function clearStorage() {
        try {
            await browser.storage.local.clear();
        }
        catch {
            throw new AppError(ERROR_CODES.USE_STORAGE.A, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function setStorage(key, value) {
        try {
            await browser.storage.local.set({ [key]: value });
        }
        catch {
            throw new AppError("xx_set_local_storage", ERROR_CATEGORY.STORAGE_API, true);
        }
    }
    async function getStorage(keys = null) {
        try {
            return await browser.storage.local.get(keys);
        }
        catch {
            throw new AppError("xx_get_local_storage", ERROR_CATEGORY.STORAGE_API, true);
        }
    }
    function addStorageChangedListener(callback) {
        const wrappedCallback = (changes, areaName) => {
            if (areaName === "local") {
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
        catch {
            throw new AppError(ERROR_CODES.USE_STORAGE.D, ERROR_CATEGORY.VALIDATION, true);
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
DomainUtils.log("COMPOSABLE useStorage");
