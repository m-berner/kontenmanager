<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'

interface IState {
  selected: number
  isFormValid: boolean
}

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const state: IState = reactive({
  selected: -1,
  isFormValid: false
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
  try {
    if (state.selected > 1) {
      records.deleteBookingType(state.selected)
      await notice([t('dialogs.deleteBookingType.success')])
    } else {
      await notice(['Start kann nicht entfernt werden'])
    }
    runtime.resetTeleport()
  } catch (e) {
    log('DELETE_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.deleteBookingType.error')])
  }
}
const title = t('dialogs.deleteBookingType.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('DELETE_BOOKING_TYPE: onMounted')
})

log('--- DeleteBookingType.vue setup ---')
</script>

<template>
  <v-form
      v-model="state.isFormValid"
      validate-on="submit"
      @submit.prevent>
    <v-select
        v-model="state.selected"
        :item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes"
        :label="t('dialogs.deleteBookingType.label')"
        density="compact"
        required
        variant="outlined"
    />
  </v-form>
</template>
