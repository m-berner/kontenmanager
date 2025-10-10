<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
//import type {IAccountDB, IBookingDB, IBookingTypeDB, IStockDB} from '@/types'
import type {DataTableHeader} from 'vuetify'
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
//import {useBrowser} from '@/composables/useBrowser'
//import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS, log} = useApp()
const {dividendsPerPage} = useSettings()

const dividendsHeaders = computed<DataTableHeader[]>(() => [
  {
    title: t('dialogs.showDividend.yearLabel'),
    align: 'start',
    sortable: false,
    key: 'year'
  },
  {
    title: t('dialogs.showDividend.sumLabel'),
    align: 'start',
    sortable: false,
    key: 'sum'
  }
])
const dividends = [
  {cID: 1, year: 2023, sum: 56.67},
  {cID: 2, year: 2024, sum: 677.23}
]

const title = t('dialogs.showDividend.title')
defineExpose({title})

log('--- ShowDividend.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-data-table
            :headers="dividendsHeaders"
            :hide-no-data="false"
            :hover="false"
            :items="dividends"
            :items-per-page="dividendsPerPage"
            :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('dialogs.showDividend.itemsPerPageText')"
            :no-data-text="t('dialogs.showDividend.noDataText')"
            density="compact"
            item-key="cID"/>
      </v-card-text>
    </v-card>
  </v-form>
</template>
