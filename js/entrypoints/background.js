import { UtilsService } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
const { actionOnClicked, runtimeOnInstalled, tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } = useBrowser();
const { installStorageLocal } = useStorage();
async function onInstall() {
    UtilsService.log("BACKGROUND: onInstall");
    await installStorageLocal();
}
async function onClick() {
    UtilsService.log("BACKGROUND: onClick");
    try {
        const foundTabs = await tabsQuery();
        if (foundTabs.length === 0) {
            const extensionTab = await tabsCreate();
            const extensionTabId = extensionTab.id ?? -1;
            UtilsService.log("BACKGROUND: Created new tab", extensionTabId);
        }
        else {
            const firstTab = foundTabs[0];
            await windowsUpdate(firstTab.windowId);
            await tabsUpdate(firstTab.id);
            UtilsService.log("BACKGROUND: Focused existing tab", firstTab.id);
        }
    }
    catch (err) {
        UtilsService.log("BACKGROUND: Error in onClick", err, "error");
    }
}
runtimeOnInstalled(onInstall);
actionOnClicked(onClick);
UtilsService.log("--- entrypoints/background.js ---");
