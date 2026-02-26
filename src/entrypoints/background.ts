/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import {useStorage} from "@/composables/useStorage";

const {installStorageLocal} = useStorage();
const {
    actionOnClicked,
    removeTab,
    runtimeOnInstalled,
    tabsCreate,
    tabsQuery,
    tabsUpdate,
    windowsUpdate
} = useBrowser();

/**
 * Handles extension installation/update lifecycle.
 *
 * Initializes default values in browser storage on add-on installation, update,
 * and also after Firefox updates which can trigger this event.
 */
async function onInstall(): Promise<void> {
    DomainUtils.log("ENTRYPOINTS background: onInstall");
    try {
        await installStorageLocal();
    } catch (err) {
        DomainUtils.log("ENTRYPOINTS background: install error", err, "error");
    }
}

/**
 * Handles the browser action (toolbar icon) click.
 *
 * Focuses an already open app tab if present; otherwise opens a new one.
 * Logs errors instead of throwing to avoid breaking the background context.
 */
async function onClick(): Promise<void> {
    DomainUtils.log("ENTRYPOINTS background: onClick");

    try {
        const foundTabs = await tabsQuery();
        // NOTE: An event listener called by an API reloads the background.js script.
        if (foundTabs.length === 0) {
            const extensionTab = await tabsCreate();
            if (extensionTab.id === undefined) {
                DomainUtils.log(
                    "ENTRYPOINTS background: Created new tab error",
                    extensionTab,
                    "error"
                );
            }
            DomainUtils.log(
                "ENTRYPOINTS background: Created new tab",
                extensionTab,
                "info"
            );
        } else {
            const [firstTab, ...remainingTabs] = foundTabs;
            if (firstTab.windowId === undefined || firstTab.id === undefined) {
                DomainUtils.log(
                    "ENTRYPOINTS background: Existing tab has no id/windowId",
                    firstTab,
                    "warn"
                );
                return;
            }
            await windowsUpdate(firstTab.windowId);
            await tabsUpdate(firstTab.id);
            DomainUtils.log(
                "ENTRYPOINTS background: Focused existing tab",
                firstTab.id
            );
            // Close other tabs
            for (const tab of remainingTabs) {
                if (tab.id === undefined) {
                    DomainUtils.log(
                        "ENTRYPOINTS background: Skipped tab without id",
                        tab,
                        "warn"
                    );
                    continue;
                }
                await removeTab(tab.id);
            }
        }
    } catch (err) {
        DomainUtils.log("ENTRYPOINTS background: Error in onClick", err, "error");
    }
}

runtimeOnInstalled(onInstall);
actionOnClicked(onClick);

DomainUtils.log("ENTRYPOINTS background", window.location.href, "info");
