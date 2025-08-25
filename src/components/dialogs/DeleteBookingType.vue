<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onMounted, type Reactive, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRecordsStore} from '@/stores/records'

interface IState {
  selected: number
}

const {t} = useI18n()
const {CONS, log, notice} = useApp()
const records = useRecordsStore()
const formRef = useTemplateRef('form-ref')

const state: Reactive<IState> = reactive({
  selected: -1
})
const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  try {
    if (state.selected > 1) {
      await records.deleteBookingType(state.selected)
      formRef.value?.reset()
      await notice([t('dialogs.deleteBookingType.success')])
    } else {
      await notice(['Start kann nicht entfernt werden'])
    }
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteBookingType.error')])
  }
}
const title = t('dialogs.deleteBookingType.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('DELETE_BOOKING_TYPE: onMounted')
  formRef.value?.reset()
})

log('--- DeleteBookingType.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" @submit.prevent>
    <v-select
        v-model="state.selected"
        :item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes"
        :label="t('dialogs.deleteBookingType.label')"
        density="compact"
        required
        variant="outlined"
    ></v-select>
  </v-form>
</template>
