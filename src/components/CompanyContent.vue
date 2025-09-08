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
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import DotMenu from '@/components/childs/DotMenu.vue'

const {log} = useNotification()
const {d, n, t} = useI18n()
const {CONS} = useConstant()
const records = useRecordsStore()
const settings = useSettingsStore()

const {stocksPerPage} = storeToRefs(settings)
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
    icon: '$updateCompany'
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
  settings.stocksPerPage = (count)
}
const onUpdatePage = (page: number): void => {
  log('COMPANY_CONTENT: onUpdatePage', {info: page})
}

log('--- StocksTable.vue setup ---')
</script>

<template>
  <v-data-table
      :headers="stocksHeaders"
      :hide-no-data="false"
      :hover="true"
      :items="records.stocks.items.filter((rec: IStock): boolean => rec.cID > 0 )"
      :items-per-page="stocksPerPage"
      :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('stocksTable.itemsPerPageText')"
      :no-data-text="t('stocksTable.noDataText')"
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
        <td>{{ item.mPortfolio }}</td>
        <td>{{ n(item.mBuyValue ?? 0, 'currency3') }}</td>
        <v-tooltip :text="n((item.mChange ?? 0) / 100, 'percent')" location="left">
          <template v-slot:activator="{ props }">
            <td :class="winLossClass(item.mEuroChange)" v-bind="props">
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
