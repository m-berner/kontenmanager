<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'
import {useAppApi} from '@/pages/background'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import OptionMenu from '@/components/helper/OptionMenu.vue'
import {computed, type Reactive, reactive} from 'vue'
import type {DataTableHeader} from 'vuetify'

type HomeMenuItem = {
  readonly id: string
  readonly title: string
  readonly icon?: string
}

interface IState {
  search: string
}

const {d, n, t} = useI18n()
const {CONS, log, utcDate} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()

const {bookings} = storeToRefs(records)
const {bookingsPerPage} = storeToRefs(settings)

const state: Reactive<IState> = reactive<IState>({
  search: ''
})

// NOTE: using "as" keyword for types means
// the programmer decides what will be considered as the type of the object.
// The "as" keyword is required mainly when TypeScriptValidateTypes (infer the type) fails.
const homeHeaders = computed<DataTableHeader[]>(() => [
  {
    title: t('appPage.headers.id'),
    align: ' d-none' as 'start' | 'center' | 'end' | undefined,
    sortable: false,
    key: 'cID'
  },
  {
    title: t('appPage.headers.action'),
    align: 'start',
    sortable: false,
    key: 'mAction'
  },
  {
    title: t('appPage.headers.date'),
    align: 'start',
    sortable: false,
    key: 'cDate'
  },
  {
    title: t('appPage.headers.debit'),
    align: 'start',
    sortable: false,
    key: 'cDebit'
  },
  {
    title: t('appPage.headers.credit'),
    align: 'start',
    sortable: false,
    key: 'cCredit'
  },
  {
    title: t('appPage.headers.description'),
    align: 'start',
    sortable: false,
    key: 'cDescription'
  },
  {
    title: t('appPage.headers.bookingType'),
    align: 'start',
    sortable: false,
    key: 'cBookingType'
  },
  {
    title: t('appPage.headers.accountNumberId'),
    align: ' d-none' as 'start' | 'center' | 'end' | undefined,
    sortable: false,
    key: 'cAccountNumberID'
  }
])
const homeMenuItems = computed<HomeMenuItem[]>(() => [
  {
    id: 'DeleteStock',
    title: t('stocksTable.menuItems.delete'),
    icon: '$tableRemove'
  },
  {
    id: 'ShowDividend',
    title: t('stocksTable.menuItems.dividend'),
    icon: '$showDividend'
  },
  {
    'id': 'ConfigCompany',
    'title': t('stocksTable.menuItems.config'),
    'icon': '$tableEdit'
  },
  {
    id: 'ExternalLink',
    title: t('stocksTable.menuItems.link'),
    icon: '$link'
  }
])

log('--- HomeContent.vue setup ---')
</script>

<template>
  <v-text-field
    v-model="state.search"
    density="compact"
    hide-details
    prepend-inner-icon="$magnify"
    single-line
    v-bind:label="t('appPage.search')"
    variant="outlined"
  ></v-text-field>
  <v-data-table
    density="compact"
    item-key="cID"
    v-bind:headers="homeHeaders"
    v-bind:hide-no-data="false"
    v-bind:hover="true"
    v-bind:items="bookings"
    v-bind:items-per-page="bookingsPerPage"
    v-bind:items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
    v-bind:items-per-page-text="t('appPage.itemsPerPageText')"
    v-bind:no-data-text="t('appPage.noDataText')"
    v-bind:search="state.search"
    v-on:update:items-per-page="(count) => { settings.setBookingsPerPage(count) }">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td>
          <OptionMenu
            v-bind:menuItems="homeMenuItems"
            v-bind:recordID="item.cID"
          ></OptionMenu>
        </td>
        <td>{{ d(utcDate(item.cDate), 'short') }}</td>
        <td>{{ n(item.cDebit, 'currency') }}</td>
        <td>{{ n(item.cCredit, 'currency') }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.getBookingTypeNameById(item.cBookingTypeID) }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
