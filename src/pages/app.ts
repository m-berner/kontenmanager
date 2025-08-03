/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createApp} from 'vue'
import AppIndex from '@/components/AppIndex.vue'
import vuetifyPlugin from '@/plugins/vuetify'
import i18nPlugin from '@/plugins/i18n'
import componentsPlugin from '@/plugins/components'
import routerPlugin from '@/plugins/router'
import piniaPlugin from '@/plugins/pinia'
import {useApp} from '@/apis/useApp'

const {CONS, log} = useApp()
const app = createApp(AppIndex)
app.config.errorHandler = (err: unknown) => {
  console.error(err)
}
app.config.warnHandler = (msg: string) => {
  console.warn(msg)
}
app.use(componentsPlugin)
app.use(vuetifyPlugin.vuetify)
app.use(i18nPlugin.i18n)
app.use(piniaPlugin.pinia)
app.use(routerPlugin.router)
app.mount('#app')

const keyStrokeController: string[] = []
const onBeforeUnload = async (): Promise<void> => {
  log('BACKGROUND: onBeforeUnload')
  await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__CLOSE}))
}
const onKeyDown = async (ev: KeyboardEvent): Promise<void> => {
  keyStrokeController.push(ev.key)
  log('BACKGROUND: onKeyDown')
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'r'
  ) {
    await browser.storage.local.clear()
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0
  ) {
    localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '0')
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && !(Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0)
  ) {
    localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '1')
  }
}
const onKeyUp = (ev: KeyboardEvent): void => {
  keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1)
}

window.addEventListener('keydown', onKeyDown, false)
window.addEventListener('keyup', onKeyUp, false)
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)

log('--- PAGE_SCRIPT app.js ---')
