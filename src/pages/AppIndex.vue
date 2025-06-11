<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useTheme} from 'vuetify'
import {useAppApi} from '@/pages/background'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const theme = useTheme()
const {CONS, log} = useAppApi()
const {_debug} = storeToRefs(settings)

const appMessagePort = browser.runtime.connect({ name: CONS.MESSAGES.PORT__APP })

const onResponse = (m: object): void => {
  log('APPINDEX: onResponse', {info: Object.values(m)[1]})
  switch (Object.values(m)[0]) {
    case CONS.MESSAGES.DB__TO_STORE__RESPONSE:
      if (Object.values(m)[1].accounts.length > 0) {
        records.initStore(Object.values(m)[1])
        if (settings.activeAccountId === undefined) {
          settings.setActiveAccountId(records.accounts[0].cID)
        }
        runtime.setLogo()
        records.sumBookings()
      }
      break
    case CONS.MESSAGES.STORES__INIT_SETTINGS__RESPONSE:
      settings.initStore(theme, Object.values(m)[1])
      break
    default:
  }
}
appMessagePort.onMessage.addListener(onResponse)

const keyStrokeController: string[] = []
const onBeforeUnload = async (ev: Event): Promise<void> => {
  log('APPINDEX: onBeforeUnload', {info: ev})
  const foundTabs = await browser.tabs.query({url: 'about:addons'})
  if (foundTabs.length > 0) {
    await browser.tabs.remove(foundTabs[0].id ?? 0)
  }
}
const onKeyDown = (ev: KeyboardEvent): void => {
  keyStrokeController.push(ev.key)
  log('APPINDEX: onKeyDown')
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'r'
  ) {
    browser.storage.local.clear()
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && _debug.value
  ) {
    browser.storage.local.set({sDebug: false})
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && !_debug.value
  ) {
    browser.storage.local.set({sDebug: true})
  }
}
const onKeyUp = (ev: KeyboardEvent): void => {
  keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1)
}
window.addEventListener('keydown', onKeyDown, false)
window.addEventListener('keyup', onKeyUp, false)
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)
appMessagePort.postMessage({type: CONS.MESSAGES.STORES__INIT_SETTINGS})
appMessagePort.postMessage({type: CONS.MESSAGES.DB__TO_STORE})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app v-bind:flat="true">
    <router-view name="title"></router-view>
    <router-view name="header"></router-view>
    <v-main>
      <router-view></router-view>
    </v-main>
    <router-view name="footer"></router-view>
  </v-app>
</template>
