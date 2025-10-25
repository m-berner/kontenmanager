<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking_Store} from '@/types.d'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRecordsStore} from '@/stores/records'

const {n, t} = useI18n()
const records = useRecordsStore()
const {log} = useApp()

const _result = ref<Array<{ title: string, subtitle: number }>>([])

const addEntryToResult = (value: { title: string, subtitle: number }) => {
  _result.value.push(value)
}
const title = t('dialogs.showAccounting.title')

defineExpose({title})

onMounted(() => {
  log('SHOW_ACCOUNTING: onMounted')
  const sums: number[] = []
  for (let i = 0; i < records.bookingTypes.items.length; i++) {
    sums[i] = records.bookings.items.filter((entry: IBooking_Store) => {
      return entry.cBookingTypeID === records.bookingTypes.items[i].cID
    }).map((entry: IBooking_Store) => {
      return entry.cCredit - entry.cDebit
    }).reduce((acc: number, cur: number) => acc + cur, 0)
    addEntryToResult({title: records.bookingTypes.items[i].cName, subtitle: sums[i]})
  }
})

log('--- ShowAccounting.vue setup ---')
</script>

<template>
  <v-form>
    <v-list height="440">
      <v-list-item
          v-if="records.accounts.isDepot"
          :subtitle="n(records.bookings.sumTaxes, 'currency')"
          :title="t('dialogs.showAccounting.taxes')"/>
      <v-list-item
          v-if="records.accounts.isDepot"
          :subtitle="n(records.bookings.sumFees, 'currency')"
          :title="t('dialogs.showAccounting.fees')"/>
      <v-list-item
          v-for="entry in _result"
          :key="entry.title"
          :subtitle="n(entry.subtitle, 'currency')"
          :title="entry.title"/>
    </v-list>
  </v-form>
</template>
