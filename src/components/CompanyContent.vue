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
import {computed, nextTick} from 'vue'
import type {DataTableHeader} from 'vuetify'

type StocksMenuItems = {
  readonly title: string
  readonly id: string
  readonly icon: string
}

// Store setup with proper typing
const {d, n, t} = useI18n()
const {CONS, toNumber} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()

const {log} = useAppApi()
//const runtime = useRuntimeStore()
// Use storeToRefs for reactive store properties
//const {_is_stocks_loading} = storeToRefs(runtime)
//const {stocksPerPage} = storeToRefs(settings)
//const {stocks} = storeToRefs(records)
// Computed properties with proper typing
//const tableHeaders: ComputedRef<TableHeader[]> = computed(() => {
// const headers = t('stocksTable.headers')
// headers.map((item: { title: string, align: string, sortable: boolean, key: string }) => ({
//   title: rt(item.title),
//   align: rt(item.align) as 'start' | 'center' | 'end' | undefined,
//   sortable: item.sortable,
//   key: rt(item.key)
// }))
//return tm<'stocksTable.headers'>('stocksTable.headers') //as Array<TableHeader>
//})

const {stocksPerPage} = storeToRefs(settings)
const {stocks} = storeToRefs(records)
const stocksHeaders = computed<DataTableHeader[]>(() => [
  {
    title: t('stocksTable.headers.id'),
    align: ' d-none' as 'center' | 'start' | 'end' | undefined,
    sortable: false,
    key: 'cID'
  },
  {
    title: t('stocksTable.headers.action'),
    align: 'start',
    sortable: false,
    key: 'mAction'
  },
  {
    title: t('stocksTable.headers.company'),
    align: 'start',
    sortable: true,
    key: 'cCompany'
  },
  {
    title: t('stocksTable.headers.isin'),
    align: 'start',
    sortable: false,
    key: 'cISIN'
  },
  {
    title: t('stocksTable.headers.qf'),
    align: 'start',
    sortable: false,
    key: 'cQuarterDay'
  },
  {
    title: t('stocksTable.headers.gm'),
    align: 'start',
    sortable: false,
    key: 'cMeetingDay'
  },
  {
    title: t('stocksTable.headers.portfolio'),
    align: 'start',
    sortable: true,
    key: 'mPortfolio'
  },
  {
    title: t('stocksTable.headers.buy'),
    align: 'start',
    sortable: false,
    key: 'mBuyValue'
  },
  {
    title: t('stocksTable.headers.winLoss'),
    align: 'start',
    sortable: false,
    key: 'mEuroChange'
  },
  {
    title: t('stocksTable.headers.52low'),
    align: 'start',
    sortable: false,
    key: 'mMin'
  },
  {
    title: t('stocksTable.headers.rate'),
    align: 'start',
    sortable: false,
    key: 'mValue'
  },
  {
    title: t('stocksTable.headers.52high'),
    align: 'start',
    sortable: false,
    key: 'mMax'
  }
])
const stocksMenuItems = computed<StocksMenuItems[]>(() => [
  {
    'id': 'DeleteStock',
    'title': t('stocksTable.menuItems.delete'),
    'icon': '$tableRemove'
  },
  {
    'id': 'ShowDividend',
    'title': t('stocksTable.menuItems.dividend'),
    'icon': '$showDividend'
  },
  {
    'id': 'ConfigCompany',
    'title': t('stocksTable.menuItems.config'),
    'icon': '$tableEdit'
  },
  {
    'id': 'ExternalLink',
    'title': t('stocksTable.menuItems.link'),
    'icon': '$link'
  }
])
// Fixed: Use a function that returns a function for proper ref handling
const mSetDynamicStyleWinLoss = () => {
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
// const onUpdatePageHandler = async (page: number): Promise<void> => {
//   log('COMPANY_CONTENT: onUpdatePageHandler', {info: page})
//   //records.setActiveStocksPage(page)
//   //await records.updateWrapper()
// }
const onUpdateItemsPerPage = (count: number): void => {
  settings.setStocksPerPage(count)
}
const onUpdatePage = (page: number): void => {
  console.error(page)
}

log('--- StocksTable.vue setup ---')
</script>

<template>
  <v-data-table
    density="compact"
    item-key="cID"
    v-bind:headers="stocksHeaders"
    v-bind:hide-no-data="false"
    v-bind:hover="true"
    v-bind:items="stocks"
    v-bind:items-per-page="stocksPerPage"
    v-bind:items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
    v-bind:items-per-page-text="t('stocksTable.itemsPerPageText')"
    v-bind:no-data-text="t('stocksTable.noDataText')"
    v-on:update:items-per-page="onUpdateItemsPerPage"
    v-on:update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td>
          <OptionMenu
            menuType="stocks"
            v-bind:menuItems="stocksMenuItems"
            v-bind:recordID="item.cID">
          </OptionMenu>
        </td>
        <td>{{ item.cCompany }}</td>
        <td>{{ item.cISIN }}</td>
        <td v-if="new Date(item.cQuarterDay).getTime() > 0">{{ d(new Date(item.cQuarterDay), 'short') }}</td>
        <td v-else></td>
        <td v-if="new Date(item.cMeetingDay).getTime() > 0">{{ d(new Date(item.cMeetingDay), 'short') }}</td>
        <td v-else></td>
        <td>{{ item.mPortfolio }}</td>
        <td>{{ n(item.mBuyValue ?? 0, 'currency3') }}</td>
        <v-tooltip location="left" v-bind:text="n((item.mChange ?? 0) / 100, 'percent')">
          <template v-slot:activator="{ props }">
            <td v-bind:ref="mSetDynamicStyleWinLoss" v-bind="props">
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
