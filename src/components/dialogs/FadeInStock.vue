<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock} from '@/types'
import type {Ref} from 'vue'
import {onMounted, ref} from 'vue'
import {useRecordsStore} from '@/stores/records'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'

const {t} = useI18n()
const {log, toNumber} = useApp()
const runtime = useRuntime()
const records = useRecordsStore()

const _selected: Ref<IStock | null> = ref(null)
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('FADE_IN_STOCK: onClickOk')
  const records = useRecordsStore()
  const indexOfPassiveStock = records.stocks.passive.findIndex((passiveStock: IStock) => {
    return _selected.value?.cID === passiveStock.cID
  })
  if (indexOfPassiveStock > -1 && toNumber(_selected.value?.cFadeOut) === 0) {
    records.stocks.passive.splice(indexOfPassiveStock, 1)
    //records.stocks.itemsActive.push(_selected.value as IStock)
  }
  records.stocks.updateStock(_selected.value as IStock)
  runtime.resetTeleport()
}
const title = t('dialogs.fadeInStock.title')

defineExpose({onClickOk, title})

onMounted(() => {
  log('FADE_IN_STOCK: onMounted')
  _selected.value = null // CONS.RECORDS.TEMPLATES.STOCK
})

log('--- FadeInStock.vue setup ---')
</script>

<template>
  <v-alert v-if="records.stocks.passive.length === 0">{{ t('dialogs.fadeInStock.message') }}</v-alert>
  <v-form v-else
          ref="formRef"
          validate-on="submit"
          v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-select
          v-model="_selected"
          density="compact"
          item-title="cCompany"
          v-bind:clearable="true"
          v-bind:items="records.stocks.passive"
          v-bind:label="t('dialogs.fadeInStock.title')"
          v-bind:return-object="true"
          variant="outlined"
          v-on:update:modelValue="() => (_selected as IStock).cFadeOut = 0"/>
    </v-card-text>
  </v-form>
</template>
