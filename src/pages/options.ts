/* eslint-disable no-console */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createApp} from 'vue'
import {useNotification} from '@/composables/useNotification'
import vuetifyPlugin from '@/plugins/vuetify'
import i18nPlugin from '@/plugins/i18n'
import OptionsIndex from '@/components/OptionsIndex.vue'

const {log} = useNotification()

const op = createApp(OptionsIndex)
op.config.errorHandler = (err: unknown) => {
    console.error(err)
}
op.config.warnHandler = (msg: string) => {
    console.warn(msg)
}
op.use(vuetifyPlugin.vuetify)
op.use(i18nPlugin.i18n)
op.mount('#options')

log('--- PAGE_SCRIPT options.js ---', {info: window.location.href})
