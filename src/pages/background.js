import { useApp } from '@/composables/useApp';
import { useBrowser } from '@/composables/useBrowser';
import { useIndexedDB } from '@/composables/useIndexedDB';
const { CONS, log } = useApp();
if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
    const { installStorageLocal } = useBrowser();
    const { getDB } = useIndexedDB();
    const onInstall = async () => {
        log('BACKGROUND: onInstall');
        await installStorageLocal();
        const db = await getDB();
        db.close();
    };
    const onClick = async () => {
        log('BACKGROUND: onClick');
        const foundTabs = await browser.tabs.query({ url: `${browser.runtime.getURL(CONS.PAGES.INDEX)}` });
        if (foundTabs.length === 0) {
            const extensionTab = await browser.tabs.create({
                url: browser.runtime.getURL(CONS.PAGES.INDEX),
                active: true
            });
            const extensionTabIdStr = (extensionTab.id ?? -1).toString();
            sessionStorage.setItem(CONS.DEFAULTS.SESSION_STORAGE.EXTENSION_TAB_ID, extensionTabIdStr);
        }
        else {
            await browser.windows.update(foundTabs[0].windowId ?? 0, {
                focused: true
            });
            await browser.tabs.update(foundTabs[0].id ?? 0, { active: true });
        }
    };
    browser.runtime.onInstalled.addListener(onInstall);
    browser.action.onClicked.addListener(onClick);
    log('--- PAGE_SCRIPT background.js ---', { info: window.document.location.href });
}
log('--- PAGE_SCRIPT background.js (does nothing) ---');
