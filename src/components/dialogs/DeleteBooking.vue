<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useAppApi} from '@/pages/background'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'

const {t} = useI18n()
const {CONS, log, notice} = useAppApi()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const ok = async (): Promise<void> => {
  log('DELETE_BOOKING: ok')
  const appMessagePort = browser.runtime.connect({ name: CONS.MESSAGES.PORT__APP })
  try {
    const onResponse = async (m: object): Promise<void> => {
      log('DELETE_BOOKING: onResponse')
      if (Object.values(m)[0] === CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE) {
        records.deleteBooking(runtime.bookingId)
        records.sumBookings()
        runtime.resetTeleport()
        await notice([t('dialogs.deleteBooking.success')])
      }
    }
    appMessagePort.onMessage.addListener(onResponse)
    appMessagePort.postMessage({
      type: CONS.MESSAGES.DB__DELETE_BOOKING, data: runtime.bookingId
    })
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteBooking.error')])
  }
}
const title = t('dialogs.deleteBooking.title')

defineExpose({ok, title})

log('--- DeleteBooking.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <p class="text-align-center">{{ records.getBookingTextById(runtime.bookingId) }}</p>
    <p class="text-align-center">{{ t('dialogs.deleteBooking.ask') }}</p>
  </v-form>
</template>
