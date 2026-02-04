import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
const { actionOnClicked, removeTab, runtimeOnInstalled, tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } = useBrowser();
const { installStorageLocal } = useStorage();
async function onInstall() {
    DomainUtils.log("BACKGROUND: onInstall");
    try {
        await installStorageLocal();
    }
    catch (err) {
        DomainUtils.log("BACKGROUND: install error", err, "error");
    }
}
async function onClick() {
    DomainUtils.log("BACKGROUND: onClick");
    try {
        const foundTabs = await tabsQuery();
        if (foundTabs.length === 0) {
            const extensionTab = await tabsCreate();
            if (extensionTab.id === undefined) {
                DomainUtils.log("BACKGROUND: Created new tab error", extensionTab, "error");
            }
            DomainUtils.log("BACKGROUND: Created new tab", extensionTab, "info");
        }
        else {
            const [firstTab, ...remainingTabs] = foundTabs;
            await windowsUpdate(firstTab.windowId);
            await tabsUpdate(firstTab.id);
            DomainUtils.log("BACKGROUND: Focused existing tab", firstTab.id);
            for (const tab of remainingTabs) {
                await removeTab(tab.id);
            }
        }
    }
    catch (err) {
        DomainUtils.log("BACKGROUND: Error in onClick", err, "error");
    }
}
runtimeOnInstalled(onInstall);
actionOnClicked(onClick);
