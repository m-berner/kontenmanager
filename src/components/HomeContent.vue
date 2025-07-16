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
import {useApp} from '@/pages/background'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import OptionMenu from '@/components/helper/OptionMenu.vue'
import {type Reactive, reactive} from 'vue'
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
const {CONS, log, utcDate} = useApp()
const records = useRecordsStore()
const settings = useSettingsStore()

const state: Reactive<IState> = reactive<IState>({
  search: ''
})

const {bookings} = storeToRefs(records)
const {bookingsPerPage} = storeToRefs(settings)
const homeHeaders: DataTableHeader[] = [
  // NOTE: using the "as" keyword for type means the programmer decides what will be considered as the type of the object.
  // The "as" keyword is required mainly when TypeScriptValidateTypes (infer the type) fails.
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
  }
]
const homeMenuItems: HomeMenuItem[] = [
  {
    id: 'DeleteBooking',
    title: t('appPage.menuItems.delete'),
    icon: '$tableRemove'
  }
]
const onUpdateItemsPerPage = (count: number): void => {
  settings.setBookingsPerPage(count)
}
const onUpdatePage = (page: number): void => {
  console.error(page)
}

log('--- HomeContent.vue setup ---')
</script>

<template>
  <v-text-field
    v-model="state.search"
    density="compact"
    hide-details
    prepend-inner-icon="$magnify"
    single-line
    variant="outlined"
    v-bind:label="t('appPage.search')"
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
    v-on:update:items-per-page="onUpdateItemsPerPage"
    v-on:update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
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
        <td class="d-none">{{ item.cAccountNumberID }}</td>
      </tr>
    </template>
  </v-data-table>
</template>

<style scoped>
.d-none {
  display: none;
}
</style>
