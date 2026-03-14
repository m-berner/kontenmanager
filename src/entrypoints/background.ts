/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {log} from "@/domains/utils/utils";
import {browserService} from "@/services/browserService";
import {storageAdapter} from "@/domains/storage/storageAdapter";

const {installStorageLocal} = storageAdapter();

/**
 * Handles extension installation/update lifecycle.
 *
 * Initializes default values in browser storage on add-on installation, update,
 * and also after Firefox updates which can trigger this event.
 */
async function onInstall(): Promise<void> {
    log("ENTRYPOINTS background: onInstall");
    try {
        await installStorageLocal();
    } catch (err) {
        log("ENTRYPOINTS background: onInstall error", err, "error");
    }
}

/**
 * Handles the browser action (toolbar icon) click.
 *
 * Focuses an already open app tab if present; otherwise opens a new one.
 * Logs errors instead of throwing to avoid breaking the background context.
 */
async function onClick(): Promise<void> {
    log("ENTRYPOINTS background: onClick");

    try {
        const foundTabs = await browserService.tabsQuery();
        // NOTE: An event listener called by an API reloads the background.js script.
        if (foundTabs.length === 0) {
            const extensionTab = await browserService.tabsCreate();
            if (extensionTab.id === undefined) {
                log(
                    "ENTRYPOINTS background: Created new tab error",
                    extensionTab,
                    "error"
                );
            }
            log(
                "ENTRYPOINTS background: Created new tab",
                extensionTab,
                "info"
            );
        } else {
            const [firstTab, ...remainingTabs] = foundTabs;
            if (firstTab.windowId === undefined || firstTab.id === undefined) {
                log(
                    "ENTRYPOINTS background: Existing tab has no id/windowId",
                    firstTab,
                    "warn"
                );
                return;
            }
            await browserService.windowsUpdate(firstTab.windowId);
            await browserService.tabsUpdate(firstTab.id);
            log(
                "ENTRYPOINTS background: Focused existing tab",
                firstTab.id
            );
            // Close other tabs
            for (const tab of remainingTabs) {
                if (tab.id === undefined) {
                    log(
                        "ENTRYPOINTS background: Skipped tab without id",
                        tab,
                        "warn"
                    );
                    continue;
                }
                await browserService.removeTab(tab.id);
            }
        }
    } catch (err) {
        log("ENTRYPOINTS background: Error in onClick", err, "error");
    }
}

browserService.runtimeOnInstalled(onInstall);
browserService.actionOnClicked(onClick);

log("ENTRYPOINTS background", window.location.href, "info");
