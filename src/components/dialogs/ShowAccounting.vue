<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {DataTableHeader} from 'vuetify'
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

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

const sumsHeaders = computed<DataTableHeader[]>(() => [
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
])

const accountEntries = computed(() => {
  const result: IAccountEntry[] = []
  const categories = records.bookingTypes.items.filter((rec) => rec.cID > 0)
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
    name: t('dialogs.showAccounting.sum'),
    sum: records.bookings.sumBookingTypes.reduce((acc: number, cur: number) => acc + cur, 0) + records.bookings.sumTaxes + records.bookings.sumFees,
    nameClass: 'font-weight-bold',
    sumClass: 'font-weight-bold'
  })
  if (records.accounts.isDepot) {
    result.unshift({
      id: categories.length + 1,
      name: t('dialogs.showAccounting.taxes'),
      sum: records.bookings.sumTaxes,
      nameClass: '',
      sumClass: 'color-red'
    })
    result.unshift({
      id: categories.length + 2,
      name: t('dialogs.showAccounting.fees'),
      sum: records.bookings.sumFees,
      nameClass: '',
      sumClass: 'color-red'
    })
  }
  return result
})

const title = t('dialogs.showAccounting.title')

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
            :items-per-page-text="t('dialogs.showAccounting.itemsPerPageText')"
            :no-data-text="t('dialogs.showAccounting.noDataText')"
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
