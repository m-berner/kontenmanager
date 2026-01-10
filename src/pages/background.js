import { useApp } from '@/composables/useApp';
import { useBrowser } from '@/composables/useBrowser';
import { useAppConfig } from '@/composables/useAppConfig';
const { log } = useApp();
const { SESSION_STORAGE } = useAppConfig();
const { actionOnClicked, installStorageLocal, runtimeOnInstalled, tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } = useBrowser();
async function onInstall() {
    log('BACKGROUND: onInstall');
    await installStorageLocal();
}
async function onClick() {
    log('BACKGROUND: onClick');
    const foundTabs = await tabsQuery();
    if (foundTabs.length === 0) {
        const extensionTab = await tabsCreate();
        const extensionTabIdStr = (extensionTab.id ?? -1).toString();
        sessionStorage.setItem(SESSION_STORAGE.EXTENSION_TAB_ID.key, extensionTabIdStr);
    }
    else {
        await windowsUpdate(foundTabs[0].windowId);
        await tabsUpdate(foundTabs[0].id);
    }
}
runtimeOnInstalled(onInstall);
actionOnClicked(onClick);
log('--- PAGE_SCRIPT background.js ---', window.document.location.href, 'info');
log('--- PAGE_SCRIPT background.js (does nothing) ---');
