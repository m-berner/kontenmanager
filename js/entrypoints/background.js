import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
const { actionOnClicked, removeTab, runtimeOnInstalled, tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } = useBrowser();
const { installStorageLocal } = useStorage();
async function onInstall() {
    DomainUtils.log("ENTRYPOINTS BACKGROUND: onInstall");
    try {
        await installStorageLocal();
    }
    catch (err) {
        DomainUtils.log("ENTRYPOINTS BACKGROUND: install error", err, "error");
    }
}
async function onClick() {
    DomainUtils.log("ENTRYPOINTS BACKGROUND: onClick");
    try {
        const foundTabs = await tabsQuery();
        if (foundTabs.length === 0) {
            const extensionTab = await tabsCreate();
            if (extensionTab.id === undefined) {
                DomainUtils.log("ENTRYPOINTS BACKGROUND: Created new tab error", extensionTab, "error");
            }
            DomainUtils.log("ENTRYPOINTS BACKGROUND: Created new tab", extensionTab, "info");
        }
        else {
            const [firstTab, ...remainingTabs] = foundTabs;
            await windowsUpdate(firstTab.windowId);
            await tabsUpdate(firstTab.id);
            DomainUtils.log("ENTRYPOINTS BACKGROUND: Focused existing tab", firstTab.id);
            for (const tab of remainingTabs) {
                await removeTab(tab.id);
            }
        }
    }
    catch (err) {
        DomainUtils.log("ENTRYPOINTS BACKGROUND: Error in onClick", err, "error");
    }
}
runtimeOnInstalled(onInstall);
actionOnClicked(onClick);
