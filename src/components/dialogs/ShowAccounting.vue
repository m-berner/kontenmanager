<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import type {IAccountEntry, IHeader} from '@/types'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const {sumsPerPage} = storeToRefs(settings)
const {setSumsPerPage} = settings
const {CONS, log} = useApp()

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: IHeader[] }>({
  STRINGS: {
    TITLE: t('dialogs.showAccounting.title'),
    ITEMS_PER_PAGE_TEXT: t('dialogs.showAccounting.itemsPerPageText'),
    NO_DATA_TEXT: t('dialogs.showAccounting.noDataText'),
    FEES: t('dialogs.showAccounting.fees'),
    TAXES: t('dialogs.showAccounting.taxes'),
    SUM: t('dialogs.showAccounting.sum'),
    YEAR: t('dialogs.showAccounting.year')
  },
  HEADERS: [
    {
      title: t('dialogs.showAccounting.nameLabel'),
      align: 'start',
      sortable: false,
      key: 'name'
    },
    {
      title: t('dialogs.showAccounting.sumLabel'),
      align: 'start',
      sortable: false,
      key: 'sum'
    }
  ]
})

const currentYear = new Date().getFullYear()
const selected = ref(currentYear)

const yearEntries = computed(() => {
  const years = Array.from(records.bookings.bookedYears)
  return years.map((entry) => {
    return {id: entry, title: entry.toString()}
  })
})
const accountEntries = computed(() => {
  const y = selected.value
  const result: IAccountEntry[] = []
  const sums = records.bookings.sumBookingsPerTypeAndYear(y)
  let finalSum = 0
  for (let i = 0; i < sums.length; i++) {
    let sc = ''
    if (sums[i].key < 0) {
      sc = 'color-red'
    }
    result.push({
      id: i,
      name: sums[i].value,
      sum: sums[i].key,
      nameClass: '',
      sumClass: sc
    })
    finalSum += sums[i].key
  }
  result.push({
    id: sums.length,
    name: T.STRINGS.SUM,
    sum: finalSum + records.bookings.sumTaxes(y) + records.bookings.sumFees(y),
    nameClass: 'font-weight-bold',
    sumClass: 'font-weight-bold'
  })
  if (records.accounts.isDepot) {
    result.unshift({
      id: sums.length + 1,
      name: T.STRINGS.TAXES,
      sum: records.bookings.sumTaxes(y),
      nameClass: '',
      sumClass: 'color-red'
    })
    result.unshift({
      id: sums.length + 2,
      name: T.STRINGS.FEES,
      sum: records.bookings.sumFees(y),
      nameClass: '',
      sumClass: 'color-red'
    })
  }
  return result
})

const title = T.STRINGS.TITLE
defineExpose({title})

log('--- ShowAccounting.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-select
        v-model="selected"
        item-title="title"
        item-value="id"
        :items="yearEntries"
        :label="T.STRINGS.YEAR"
        clearable
        density="compact"
        max-width="300"
        variant="outlined"
    />
    <v-card>
      <v-card-text class="pa-5">
        <v-data-table
            :headers="T.HEADERS"
            :hide-no-data="false"
            :hover="false"
            :items="accountEntries"
            :items-per-page="sumsPerPage"
            :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
            :no-data-text="T.STRINGS.NO_DATA_TEXT"
            density="compact"
            item-key="id"
            @update:items-per-page="setSumsPerPage">
          <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
              <td class="d-none">{{ item.id }}</td>
              <td :class="item.nameClass">{{ item.name }}</td>
              <td :class="item.sumClass">{{ n(item.sum, 'currency') }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
