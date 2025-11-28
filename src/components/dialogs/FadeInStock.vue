<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock_Store} from '@/types.d'
import {onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useStocksDB} from '@/composables/useIndexedDB'

interface IT {
  STRINGS: Record<string, string>
}

const {t} = useI18n()
const {log} = useApp()
const {update} = useStocksDB()
const runtime = useRuntimeStore()
const records = useRecordsStore()

const T = Object.freeze<IT>({
  STRINGS: {
    TITLE: t('dialogs.fadeInStock.title'),
    SELECT_LABEL: t('dialogs.fadeInStock.selectLabel')
  }
})

const _selected = ref<IStock_Store | null>(null)
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
  log('FADE_IN_STOCK: onClickOk')
  if (_selected.value !== null) {
    _selected.value.cFadeOut = 0
    await update(_selected.value)
  }
  runtime.resetTeleport()
}
const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onMounted(() => {
  log('FADE_IN_STOCK: onMounted')
  _selected.value = null
})

log('--- FadeInStock.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-select
          v-model="_selected"
          density="compact"
          item-key="cID"
          item-title="cCompany"
          v-bind:clearable="true"
          v-bind:items="records.stocks.passive"
          v-bind:label="T.STRINGS.SELECT_LABEL"
          v-bind:return-object="true"
          variant="outlined"/>
    </v-card-text>
  </v-form>
</template>
