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
import {useRecordsStore} from '@/stores/records'
import type {IBooking} from '@/types.d'
import {useNotification} from '@/composables/useNotification'

interface IShowAccounting {
  _result: Array<{ title: string, subtitle: string }>
}

const {n, t} = useI18n()
const records = useRecordsStore()
const {log} = useNotification()

const state: IShowAccounting = reactive<IShowAccounting>({
  _result: []
})
const cAddEntryToResult = (value: { title: string, subtitle: string }) => {
  state._result.push(value)
}
const title = t('dialogs.showAccounting.title')

defineExpose({title})

onMounted(() => {
  log('SHOW_ACCOUNTING: onMounted')
  const sums: number[] = []
  for (let i = 0; i < records.bookingTypes.length; i++) {
    sums[i] = records.bookings.filter((entry: IBooking) => {
      return entry.cBookingTypeID === records.bookingTypes[i].cID
    }).map((entry: IBooking) => {
      return entry.cCredit - entry.cDebit
    }).reduce((acc: number, cur: number) => acc + cur, 0)
    cAddEntryToResult({title: records.bookingTypes[i].cName, subtitle: n(sums[i], 'currency')})
  }
})

log('--- ShowAccounting.vue setup ---')
</script>

<template>
  <v-form>
    <v-list height="440">
      <v-list-item
          v-for="entry in state._result"
          :key="entry.title"
          :subtitle="entry.subtitle"
          :title="entry.title"/>
    </v-list>
  </v-form>
</template>
