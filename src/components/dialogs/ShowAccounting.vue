<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {DataTableHeader} from 'vuetify'
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'

interface IAccountEntry {
  id: number
  name: string
  sum: number
  nameClass: string
  sumClass: string
}

const {n, t} = useI18n()
const records = useRecordsStore()
const {sumsPerPage} = useSettingsStore()
const {CONS, log} = useApp()

const STRINGS = Object.freeze({
  TITLE: t('dialogs.showAccounting.title'),
  ITEMS_PER_PAGE_TEXT: t('dialogs.showAccounting.itemsPerPageText'),
  NO_DATA_TEXT: t('dialogs.showAccounting.noDataText'),
  FEES: t('dialogs.showAccounting.fees'),
  TAXES: t('dialogs.showAccounting.taxes'),
  SUM: t('dialogs.showAccounting.sum'),
  NAME_LABEL: t('dialogs.showAccounting.nameLabel'),
  SUM_LABEL: t('dialogs.showAccounting.sumLabel')
})

const sumsHeaders: readonly DataTableHeader[] = Object.freeze([
  {
    title: STRINGS.NAME_LABEL,
    align: 'start',
    sortable: false,
    key: 'name'
  },
  {
    title: STRINGS.SUM_LABEL,
    align: 'start',
    sortable: false,
    key: 'sum'
  }
])

const accountEntries = computed(() => {
  const result: IAccountEntry[] = []
  const {items: bookingTypeItems} = storeToRefs(records.bookingTypes)
  const categories = bookingTypeItems.value.filter((rec) => rec.cID > 0)
  for (let i = 0; i < categories.length; i++) {
    let sc = ''
    if (records.bookings.sumBookingTypes[i] < 0) {
      sc = 'color-red'
    }
    result.push({
      id: i,
      name: categories[i].cName,
      sum: records.bookings.sumBookingTypes[i],
      nameClass: '',
      sumClass: sc
    })
  }
  result.push({
    id: categories.length,
    name: STRINGS.SUM,
    sum: records.bookings.sumBookingTypes.reduce((acc: number, cur: number) => acc + cur, 0) + records.bookings.sumTaxes + records.bookings.sumFees,
    nameClass: 'font-weight-bold',
    sumClass: 'font-weight-bold'
  })
  if (records.accounts.isDepot) {
    result.unshift({
      id: categories.length + 1,
      name: STRINGS.TAXES,
      sum: records.bookings.sumTaxes,
      nameClass: '',
      sumClass: 'color-red'
    })
    result.unshift({
      id: categories.length + 2,
      name: STRINGS.FEES,
      sum: records.bookings.sumFees,
      nameClass: '',
      sumClass: 'color-red'
    })
  }
  return result
})

const title = STRINGS.TITLE
defineExpose({title})

log('--- ShowAccounting.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-data-table
            :headers="sumsHeaders"
            :hide-no-data="false"
            :hover="false"
            :items="accountEntries"
            :items-per-page="sumsPerPage"
            :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="STRINGS.ITEMS_PER_PAGE_TEXT"
            :no-data-text="STRINGS.NO_DATA_TEXT"
            density="compact"
            item-key="id">
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
