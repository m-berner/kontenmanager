/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";

const {
  actionOnClicked,
  removeTab,
  runtimeOnInstalled,
  tabsCreate,
  tabsQuery,
  tabsUpdate,
  windowsUpdate
} = useBrowser();
const { installStorageLocal } = useStorage();

// TODO Optional: also register a runtime.onStartup hook if you want a lightweight sanity check on critical defaults after a cold browser start. If your storage init is idempotent, it’s safe.
/**
 * Handles extension installation/update lifecycle.
 *
 * Initializes default values in browser storage on add-on installation, update,
 * and also after Firefox updates which can trigger this event.
 */
async function onInstall(): Promise<void> {
  DomainUtils.log("BACKGROUND: onInstall");
  try {
    await installStorageLocal();
  } catch (err) {
    DomainUtils.log("BACKGROUND: install error", err, "error");
  }
}

/**
 * Handles the browser action (toolbar icon) click.
 *
 * Focuses an already open app tab if present; otherwise opens a new one.
 * Logs errors instead of throwing to avoid breaking the background context.
 */
async function onClick(): Promise<void> {
  DomainUtils.log("BACKGROUND: onClick");

  try {
    const foundTabs = await tabsQuery();
    // NOTE: An event listener called by an API reloads the background.js script.
    if (foundTabs.length === 0) {
      const extensionTab = await tabsCreate();
      if (extensionTab.id === undefined) {
        DomainUtils.log("BACKGROUND: Created new tab error", extensionTab, "error");
      }
      DomainUtils.log("BACKGROUND: Created new tab", extensionTab, "info");
    } else {
      const [ firstTab, ...remainingTabs ] = foundTabs;
      await windowsUpdate(firstTab.windowId!);
      await tabsUpdate(firstTab.id!);
      DomainUtils.log("BACKGROUND: Focused existing tab", firstTab.id);
      // Close other tabs
      for (const tab of remainingTabs) {
        await removeTab(tab.id!);
      }
    }
  } catch (err) {
    DomainUtils.log("BACKGROUND: Error in onClick", err, "error");
  }
}

runtimeOnInstalled(onInstall);
actionOnClicked(onClick);
