<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {DataTableHeader} from 'vuetify'
import DotMenu from '@/components/helper/DotMenu.vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {computed} from 'vue'

// Store setup with proper typing
const {log} = useApp()
const {d, n, t} = useI18n()
const {CONS, toNumber} = useApp()
const records = useRecordsStore()
const settings = useSettingsStore()

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
//const {stocks} = storeToRefs(records)
const stocksHeaders: DataTableHeader[] = [
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
]
const stocksMenuItems: StocksMenuItems[] = [
  {
    'id': 'DeleteStock',
    'title': t('stocksTable.menuItems.delete'),
    'icon': '$deleteCompany'
  },
  {
    'id': 'ShowDividend',
    'title': t('stocksTable.menuItems.dividend'),
    'icon': '$showDividend'
  },
  {
    'id': 'UpdateStock',
    'title': t('stocksTable.menuItems.update'),
    'icon': '$updateCompany'
  },
  {
    'id': 'ExternalLink',
    'title': t('stocksTable.menuItems.link'),
    'icon': '$link'
  }
]
// Fixed: Use a function that returns a function for proper ref handling
const setDynamicStyleWinLoss = computed(() => {
  return (el: HTMLElement | null): void => {
    if (el !== null) {
      // Use nextTick to ensure DOM is updated
      //await nextTick()
      const value = toNumber(el.textContent)
      if (value < 0) {
        el.classList.add('color-red')
      } else if (value > 0) {
        el.classList.add('color-black')
      }
      el.classList.add('font-weight-bold')
    }
  }
})
// const onUpdatePageHandler = async (page: number): Promise<void> => {
//   log('COMPANY_CONTENT: onUpdatePageHandler', {info: page})
//   //records.setActiveStocksPage(page)
//   //await records.updateWrapper()
// }
//const stocksFilter = (rec: IStockStore, index: number, ar: IStockStore[]): boolean => rec.cID>0
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
      :headers="stocksHeaders"
      :hide-no-data="false"
      :hover="true"
      :items="records.stocks.filter((rec: IStockStore): boolean => rec.cID > 0 )"
      :items-per-page="stocksPerPage"
      :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('stocksTable.itemsPerPageText')"
      :no-data-text="t('stocksTable.noDataText')"
      @update:items-per-page="onUpdateItemsPerPage"
      @update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu
              menuType="stocks"
              :menuItems="stocksMenuItems"
              :recordID="item.cID ?? -1">
          </DotMenu>
        </td>
        <td>{{ item.cCompany }}</td>
        <td>{{ item.cISIN }}</td>
        <td v-if="new Date(item.cQuarterDay).getTime() > 0">{{ d(new Date(item.cQuarterDay), 'short') }}</td>
        <td v-else></td>
        <td v-if="new Date(item.cMeetingDay).getTime() > 0">{{ d(new Date(item.cMeetingDay), 'short') }}</td>
        <td v-else></td>
        <td>{{ item.mPortfolio }}</td>
        <td>{{ n(item.mBuyValue ?? 0, 'currency3') }}</td>
        <v-tooltip location="left" :text="n((item.mChange ?? 0) / 100, 'percent')">
          <template v-slot:activator="{ props }">
            <td v-bind="props" :class="setDynamicStyleWinLoss">
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

<style scoped>
.d-none {
  display: none;
}
</style>
