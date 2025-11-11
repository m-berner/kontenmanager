<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IMenuItem} from '@/types'
import type {DataTableHeader} from 'vuetify'
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import DotMenu from '@/components/DotMenu.vue'
import {storeToRefs} from 'pinia'

const {d, n, t} = useI18n()
const {CONS, log, utcDate} = useApp()
const records = useRecordsStore()
const settings = useSettingsStore()
const {bookingsPerPage} = storeToRefs(settings)
const homeHeaders: readonly DataTableHeader[] = Object.freeze([
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
])
const homeMenuItems: readonly IMenuItem[] = Object.freeze([
  {
    id: 'DeleteBooking',
    title: t('appPage.menuItems.delete'),
    icon: '$deleteBooking'
  },
  {
    id: 'UpdateBooking',
    title: t('appPage.menuItems.update'),
    icon: '$updateBooking'
  }
])
const search = ref<string>('')

const onUpdateItemsPerPage = (count: number): void => {
  bookingsPerPage.value = count
}
const onUpdatePage = (page: number): void => {
  log('HOME_CONTENT: onUpdatePage', {info: page})
}

log('--- HomeContent.vue setup ---')
</script>

<template>
  <v-text-field
      v-model="search"
      :label="t('appPage.search')"
      density="compact"
      hide-details
      prepend-inner-icon="$magnify"
      single-line
      variant="outlined"/>
  <v-data-table
      :headers="homeHeaders"
      :hide-no-data="false"
      :hover="true"
      :items="records.bookings.items"
      :items-per-page="bookingsPerPage"
      :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('appPage.itemsPerPageText')"
      :no-data-text="t('appPage.noDataText')"
      :search="search"
      density="compact"
      item-key="cID"
      @update:items-per-page="onUpdateItemsPerPage"
      @update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu
              :menuItems="homeMenuItems"
              :recordID="item.cID"/>
        </td>
        <td>{{ d(utcDate(item.cBookDate), 'short') }}</td>
        <td>{{ n(item.cDebit, 'currency') }}</td>
        <td>{{ n(item.cCredit, 'currency') }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.bookingTypes.getNameById(item.cBookingTypeID) }}</td>
        <td class="d-none">{{ item.cAccountNumberID }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
