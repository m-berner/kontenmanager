<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/apis/useApp'

const {t} = useI18n()
const {CONS, log} = useApp()
const prefix = new Date().toISOString().substring(0, 10)
const fn = `${prefix}_${CONS.DB.CURRENT_VERSION}_${CONS.DB.NAME}.json`

const onClickOk = (): void => {
  log('EXPORT_DATABASE : onClickOk')
  browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__EXPORT, data: fn}))
}
const title = t('dialogs.exportToFile.title')

defineExpose({onClickOk, title})

log('--- ExportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-textarea
        v-bind:disabled="true"
        v-bind:modelValue="t('dialogs.exportDialog', { filename: fn })"
        variant="outlined"
      ></v-textarea>
    </v-card-text>
  </v-form>
</template>
