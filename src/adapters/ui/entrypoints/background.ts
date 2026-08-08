/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {log} from "@/domain/utils/utils";

import {createBackgroundAdapters} from "@/adapters/containerBackground";
import {closeDuplicateAppTab, pickSurvivor} from "@/adapters/ui/entrypoints/singleTabGuard";

const services = createBackgroundAdapters();
const {installStorageLocal} = services.storageAdapter();
const {browserAdapter} = services;

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
        const foundTabs = await browserAdapter.tabsQuery();
        // NOTE: An event listener called by an API reloads the background.js script.
        if (foundTabs.length === 0) {
            const extensionTab = await browserAdapter.tabsCreate();
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
            // Survivor chosen by the shared `pickSurvivor` (lowest tab id), not
            // by `foundTabs[0]`. This handler was a third, independent survivor
            // rule that the helper introduced to unify the other two never
            // reached — and it did exactly what that helper's comment describes
            // as the bug: keep whatever `tabs.query` happened to return first.
            // With three app tabs after a session restore — A(5), B(9), C(12) —
            // a toolbar click could focus B and close A and C, discarding the
            // tab the user had been working in, unpredictably and
            // irreproducibly. Single-tab enforcement held either way (it
            // converges to one tab) and nothing persisted is lost, since the
            // stores re-hydrate from IndexedDB; what was lost was the in-progress
            // UI state of an arbitrary tab.
            const survivor = pickSurvivor(foundTabs);
            const remainingTabs = foundTabs.filter((tab) => tab.id !== survivor.id);

            if (survivor.windowId === undefined || survivor.id === undefined) {
                log(
                    "ENTRYPOINTS background: Existing tab has no id/windowId",
                    survivor,
                    "warn"
                );
                return;
            }
            await browserAdapter.windowsUpdate(survivor.windowId);
            await browserAdapter.tabsUpdate(survivor.id);
            log(
                "ENTRYPOINTS background: Focused existing tab",
                survivor.id
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
                await browserAdapter.removeTab(tab.id);
            }
        }
    } catch (err) {
        log("ENTRYPOINTS background: Error in onClick", err, "error");
    }
}

/**
 * Handles the creation of any new tab in the browser.
 *
 * Delegates to `singleTabGuard.ts`'s `closeDuplicateAppTab()` for any tab
 * already showing the app's URL at creation time — see that function's doc
 * comment for why this exists (in short: it's the only way to react to the
 * browser's native "Duplicate Tab" context-menu action, since there's no
 * WebExtension API to remove or disable that menu item itself).
 */
async function onTabCreated(tab: browser.tabs.Tab): Promise<void> {
    if (!browserAdapter.isAppTabUrl(tab.url)) {
        return;
    }
    await closeDuplicateAppTab(browserAdapter, tab);
}

browserAdapter.runtimeOnInstalled(onInstall);
browserAdapter.actionOnClicked(onClick);
browserAdapter.tabsOnCreated(onTabCreated);

log("ENTRYPOINTS background", window.location.href, "info");
