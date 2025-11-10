import { useApp } from '@/composables/useApp';
import { useBrowser } from '@/composables/useBrowser';
const { CONS, log } = useApp();
if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
    const { actionOnClicked, installStorageLocal, runtimeOnInstalled, tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } = useBrowser();
    const onInstall = async () => {
        log('BACKGROUND: onInstall');
        await installStorageLocal();
    };
    const onClick = async () => {
        log('BACKGROUND: onClick');
        const foundTabs = await tabsQuery();
        if (foundTabs.length === 0) {
            const extensionTab = await tabsCreate();
            const extensionTabIdStr = (extensionTab.id ?? -1).toString();
            sessionStorage.setItem(CONS.DEFAULTS.SESSION_STORAGE.EXTENSION_TAB_ID, extensionTabIdStr);
        }
        else {
            await windowsUpdate(foundTabs[0].windowId);
            await tabsUpdate(foundTabs[0].id);
        }
    };
    runtimeOnInstalled(onInstall);
    actionOnClicked(onClick);
    log('--- PAGE_SCRIPT background.js ---', { info: window.document.location.href });
}
log('--- PAGE_SCRIPT background.js (does nothing) ---');
