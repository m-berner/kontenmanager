<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import OptionMenu from '@/components/helper/OptionMenu.vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'
import {computed, type ComputedRef, nextTick} from 'vue'

interface TableHeader {
  title: string
  align: 'start' | 'center' | 'end' | undefined
  sortable: boolean
  key: string
}

// Store setup with proper typing
const {d, n, rt, t, tm} = useI18n()
const {CONS, toNumber} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
// Use storeToRefs for reactive store properties
const {_is_stocks_loading} = storeToRefs(runtime)
const {stocksPerPage} = storeToRefs(settings)
const {stocks} = storeToRefs(records)
// Computed properties with proper typing
const tableHeaders: ComputedRef<TableHeader[]> = computed(() => {
  const headers = tm('stocksTable.headers')
  return headers.map((item: { title: string, align: string, sortable: boolean, key: string }) => ({
    title: rt(item.title),
    align: rt(item.align) as 'start' | 'center' | 'end' | undefined,
    sortable: item.sortable,
    key: rt(item.key)
  }))
})
// Fixed: Use a function that returns a function for proper ref handling
const setDynamicStyleWinLoss = () => {
  return async (el: HTMLElement | null): Promise<void> => {
    if (el !== null) {
      // Use nextTick to ensure DOM is updated
      await nextTick()
      const value = toNumber(el.textContent)
      if (value < 0) {
        el.classList.add('color-red')
      } else if (value > 0) {
        el.classList.add('color-black')
      }
      el.classList.add('font-weight-bold')
    }
  }
}
const onUpdatePageHandler = async (page: number): Promise<void> => {
  console.info('STOCKSTABLE: onUpdatePageHandler', page)
  records.setActiveStocksPage(page)
  await records.updateWrapper()
}
console.log('--- StocksTable.vue setup ---')
</script>
<template>
  <v-data-table
    density="compact"
    item-key="cID"
    v-bind:headers="tableHeaders"
    v-bind:hide-no-data="false"
    v-bind:hover="true"
    v-bind:items="stocks.active"
    v-bind:items-per-page="stocksPerPage"
    v-bind:items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
    v-bind:items-per-page-text="t('stocksTable.itemsPerPageText')"
    v-bind:loading="_is_stocks_loading"
    v-bind:no-data-text="t('stocksTable.noDataText')"
    v-on:update:items-per-page="settings.setStocksPerPage"
    v-on:update:page="onUpdatePageHandler">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td>
          <OptionMenu
            menuType="stocks"
            v-bind:menuItems="tm('stocksTable.menuItems')"
            v-bind:recordID="item.cID">
          </OptionMenu>
        </td>
        <td>{{ item.cCompany }}</td>
        <td>{{ item.cISIN }}</td>
        <td v-if="item.cQuarterDay > 0">{{ d(new Date(item.cQuarterDay), 'short') }}</td>
        <td v-else></td>
        <td v-if="item.cMeetingDay > 0">{{ d(new Date(item.cMeetingDay), 'short') }}</td>
        <td v-else></td>
        <td>{{ item.mPortfolio }}</td>
        <td>{{ n(item.mBuyValue ?? 0, 'currency3') }}</td>
        <v-tooltip location="left" v-bind:text="n((item.mChange ?? 0) / 100, 'percent')">
          <template v-slot:activator="{ props }">
            <td v-bind:ref="setDynamicStyleWinLoss" v-bind="props">
              {{ n(item.mEuroChange ?? 0, 'currency') }}
            </td>
          </template>
        </v-tooltip>
        <td>{{ n(item.mMin ?? 0, 'currency') }}</td>
        <td class="font-weight-bold color-black">
          {{ n(item.mValue ?? 0, 'currency3') }}
        </td>
        <td>{{ n(item.mMax ?? 0, 'currency') }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
