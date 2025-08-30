<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {defineExpose} from 'vue'

const {t} = useI18n()
const {CONS} = useConstant()
const {log} = useNotification()
const {exportToFile} = useIndexedDB()
const prefix = new Date().toISOString().substring(0, 10)
const fn = `${prefix}_${CONS.DB.CURRENT_VERSION}_${CONS.DB.NAME}.json`

const onClickOk = async (): Promise<void> => {
  log('EXPORT_DATABASE : onClickOk')
  await exportToFile(fn)
}
const title = t('dialogs.exportToFile.title')

defineExpose({onClickOk, title})

log('--- ExportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card-text class="pa-5">
      <v-textarea
          :disabled="true"
          :modelValue="t('dialogs.exportDialog', { filename: fn })"
          variant="outlined"
      />
    </v-card-text>
  </v-form>
</template>
