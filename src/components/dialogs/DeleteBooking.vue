<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {type Reactive, reactive} from 'vue'

interface IState {
  bookingId: number
}

const {t} = useI18n()
const {CONS, log, notice} = useApp()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const state: Reactive<IState> = reactive({
  bookingId: runtime.activeId
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING : onClickOk')
  try {
    records.deleteBooking(state.bookingId)
    //runtime.setLogo()
    records.sumBookings()
    //runtime.resetTeleport()
    await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.DB__DELETE_BOOKING, data: state.bookingId
    }))
    await notice([t('dialogs.deleteBooking.success')])
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteBooking.error')])
  }
}
const title = t('dialogs.deleteBooking.title')
defineExpose({onClickOk, title})

log('--- DeleteBooking.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <p class="text-align-center">{{ records.getBookingTextById(state.bookingId) }}</p>
    <p class="text-align-center">{{ t('dialogs.deleteBooking.ask') }}</p>
  </v-form>
</template>
