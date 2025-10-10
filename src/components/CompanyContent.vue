<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IMenuItem, IStock} from '@/types.d'
import type {DataTableHeader} from 'vuetify'
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useRecordsStore} from '@/stores/records'
import DotMenu from '@/components/childs/DotMenu.vue'
import {useRuntime} from '@/composables/useRuntime'

const {d, n, t} = useI18n()
const {CONS, log} = useApp()
const records = useRecordsStore()
const {stocksPerPage} = useSettings()
const {loadedStocksPages, stocksPage} = useRuntime()

const loading = ref(false)
const stocksHeaders = computed<DataTableHeader[]>(() => [
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
const stocksMenuItems = computed<IMenuItem[]>(() => [
  {
    id: 'DeleteStock',
    title: t('stocksTable.menuItems.delete'),
    icon: '$deleteCompany'
  },
  {
    id: 'ShowDividend',
    title: t('stocksTable.menuItems.dividend'),
    icon: '$showDividend'
  },
  {
    id: 'UpdateStock',
    title: t('stocksTable.menuItems.update'),
    icon: '$showCompany'
  },
  {
    id: 'ExternalLink',
    title: t('stocksTable.menuItems.link'),
    icon: '$link'
  }
])
const winLossClass = computed(() => {
  return (value: number): Record<string, boolean> => ({
    'color-red font-weight-bold': value < 0,
    'color-black font-weight-bold': value >= 0
  })
})

const onUpdateItemsPerPage = (count: number): void => {
  stocksPerPage.value = (count)
}
const onUpdatePage = async (page: number): Promise<void> => {
  log('COMPANY_CONTENT: onUpdatePage', {info: page})
  stocksPage.value = page
  if (!loadedStocksPages.has(page)) {
    loading.value = true
    await records.stocks.loadOnlineData(page)
    loading.value = false
  }
}

onMounted(async () => {
  log('COMPANY_CONTENT: onMounted')
  const requiredOnlineData = async (page: number = 1) => {
    if (records.stocks.active[stocksPerPage.value * page].mPortfolio >= 1) {
      await records.stocks.loadOnlineData(Math.ceil(stocksPerPage.value * page / stocksPerPage.value) + 1)
      await requiredOnlineData(page + 1)
    }
  }
  for (let i = 1; i < records.stocks.active.length; i++) {
    records.stocks.active[i].mPortfolio = records.bookings.portfolioByStockId(records.stocks.active[i].cID)
    records.stocks.active[i].mInvest = records.bookings.investByStockId(records.stocks.active[i].cID)
  }
  records.stocks.active.sort((a: IStock, b: IStock) => {
    return b.cFirstPage - a.cFirstPage
  }).sort((a: IStock, b: IStock) => {
    return b.mPortfolio - a.mPortfolio
  })
  if (!loadedStocksPages.has(stocksPage.value)) {
    loading.value = true
    await records.stocks.loadOnlineData(stocksPage.value)
    await requiredOnlineData()
    loading.value = false
  }
})

log('--- StocksTable.vue setup ---')
</script>

<template>
  <v-data-table
      :headers="stocksHeaders"
      :hide-no-data="false"
      :hover="true"
      :items="records.stocks.active"
      :items-per-page="stocksPerPage"
      :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('stocksTable.itemsPerPageText')"
      :no-data-text="t('stocksTable.noDataText')"
      :loading="loading"
      density="compact"
      item-key="cID"
      @update:items-per-page="onUpdateItemsPerPage"
      @update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu
              :menuItems="stocksMenuItems"
              :recordID="item.cID ?? -1"
              menuType="stocks"/>
        </td>
        <td>{{ item.cCompany }}</td>
        <td>{{ item.cISIN }}</td>
        <td v-if="new Date(item.cQuarterDay).getTime() > 0">{{ d(new Date(item.cQuarterDay), 'short') }}</td>
        <td v-else/>
        <td v-if="new Date(item.cMeetingDay).getTime() > 0">{{ d(new Date(item.cMeetingDay), 'short') }}</td>
        <td v-else/>
        <td v-if="item.mPortfolio >= 1">{{ item.mPortfolio }}</td>
        <td v-else/>
        <v-tooltip :text="n(item.mInvest !== 0 ? item.mEuroChange / item.mInvest : 1, 'percent')" location="left">
          <template v-slot:activator="{ props }">
            <td v-if="item.mPortfolio >= 1" :class="winLossClass(item.mEuroChange)" v-bind="props">
              {{ n(item.mEuroChange ?? 0, 'currency') }}
            </td>
            <td v-else/>
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
