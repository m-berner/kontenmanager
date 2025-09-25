/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'

const {CONS, log} = useApp()

if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
  const {
    actionOnClicked,
    installStorageLocal,
    runtimeOnInstalled,
    tabsCreate,
    tabsQuery,
    tabsUpdate,
    windowsUpdate
  } = useBrowser()
  const {getDB} = useIndexedDB()
  // NOTE: onInstall runs at the installation or update of the add-on. And it runs on firefox update.
  const onInstall = async (): Promise<void> => {
    log('BACKGROUND: onInstall')
    await installStorageLocal()
    const db = await getDB()
    db.close()
  }
  const onClick = async (): Promise<void> => {
    log('BACKGROUND: onClick')
    const foundTabs = await tabsQuery()
    // NOTE: An event listener called by an API reloads the background.js script.
    if (foundTabs.length === 0) {
      const extensionTab = await tabsCreate()
      const extensionTabIdStr = (extensionTab.id ?? -1).toString()
      sessionStorage.setItem(CONS.DEFAULTS.SESSION_STORAGE.EXTENSION_TAB_ID, extensionTabIdStr)
    } else {
      await windowsUpdate(foundTabs[0].windowId)
      await tabsUpdate(foundTabs[0].id)
    }
  }

  runtimeOnInstalled(onInstall)
  actionOnClicked(onClick)

  log('--- PAGE_SCRIPT background.js ---', {info: window.document.location.href})
}

log('--- PAGE_SCRIPT background.js (does nothing) ---')
