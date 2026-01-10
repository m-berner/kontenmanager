/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createApp} from 'vue'
import {useApp} from '@/composables/useApp'
import vuetifyPlugin from '@/plugins/vuetify'
import i18nPlugin from '@/plugins/i18n'
import piniaPlugin from '@/plugins/pinia'
import OptionsIndex from '@/screens/OptionsIndex.vue'

const {log} = useApp()

const op = createApp(OptionsIndex)
op.config.errorHandler = (err: unknown) => {
    log('PAGE_SCRIPTS options.js', err, 'error')
}
op.config.warnHandler = (msg: string) => {
    log('PAGE_SCRIPTS options.js', msg, 'warn')
}
op.use(vuetifyPlugin.vuetify)
op.use(i18nPlugin.i18n)
op.use(piniaPlugin.pinia)
op.mount('#options')

log('--- PAGE_SCRIPT options.js ---', window.location.href, 'info')
