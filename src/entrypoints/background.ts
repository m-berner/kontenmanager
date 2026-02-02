/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { UtilsService } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";

const {
  actionOnClicked,
  runtimeOnInstalled,
  tabsCreate,
  tabsQuery,
  tabsUpdate,
  windowsUpdate
} = useBrowser();

const { installStorageLocal } = useStorage();

/**
 * Handles extension installation/update lifecycle.
 *
 * Initializes default values in browser storage on add-on install, update,
 * and also after Firefox updates which can trigger this event.
 */
async function onInstall(): Promise<void> {
  UtilsService.log("BACKGROUND: onInstall");
  await installStorageLocal();
}

/**
 * Handles the browser action (toolbar icon) click.
 *
 * Focuses an already open app tab if present; otherwise opens a new one.
 * Logs errors instead of throwing to avoid breaking the background context.
 */
async function onClick(): Promise<void> {
  UtilsService.log("BACKGROUND: onClick");

  try {
    const foundTabs = await tabsQuery();
    // NOTE: An event listener called by an API reloads the background.js script.
    if (foundTabs.length === 0) {
      const extensionTab = await tabsCreate();
      const extensionTabId = extensionTab.id ?? -1;
      UtilsService.log("BACKGROUND: Created new tab", extensionTabId);
    } else {
      const firstTab = foundTabs[0];
      await windowsUpdate(firstTab.windowId!);
      await tabsUpdate(firstTab.id!);
      UtilsService.log("BACKGROUND: Focused existing tab", firstTab.id);
    }
  } catch (err) {
    UtilsService.log("BACKGROUND: Error in onClick", err, "error");
  }
}

runtimeOnInstalled(onInstall);
actionOnClicked(onClick);

UtilsService.log("--- entrypoints/background.js ---");
