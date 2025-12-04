<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {ref} from 'vue'
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import DotMenu from '@/components/DotMenu.vue'
import type {IHeader, IMenuItem} from '@/types'

const {d, n, t} = useI18n()
const {CONS, log, utcDate} = useApp()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)
const settings = useSettingsStore()
const {bookingsPerPage} = storeToRefs(settings)
const {setBookingsPerPage} = settings

console.error(records.bookingTypes.items)

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: IHeader[], MENU_ITEMS: IMenuItem[] }>({
  STRINGS: {
    ITEMS_PER_PAGE_TEXT: t('homePage.bookingsTable.itemsPerPageText'),
    NO_DATA_TEXT: t('homePage.bookingsTable.noDataText'),
    SEARCH_LABEL: t('homePage.search')
  },
  HEADERS: [
    {
      title: t('homePage.bookingsTable.headers.action'),
      align: 'start',
      sortable: false,
      key: 'mAction'
    },
    {
      title: t('homePage.bookingsTable.headers.date'),
      align: 'start',
      sortable: false,
      key: 'cDate'
    },
    {
      title: t('homePage.bookingsTable.headers.debit'),
      align: 'start',
      sortable: false,
      key: 'cDebit'
    },
    {
      title: t('homePage.bookingsTable.headers.credit'),
      align: 'start',
      sortable: false,
      key: 'cCredit'
    },
    {
      title: t('homePage.bookingsTable.headers.description'),
      align: 'start',
      sortable: false,
      key: 'cDescription'
    },
    {
      title: t('homePage.bookingsTable.headers.bookingType'),
      align: 'start',
      sortable: false,
      key: 'cBookingType'
    }
  ],
  MENU_ITEMS: [
    {
      id: 'DeleteBooking',
      title: t('homePage.bookingsTable.menuItems.delete'),
      icon: '$deleteBooking'
    },
    {
      id: 'UpdateBooking',
      title: t('homePage.bookingsTable.menuItems.update'),
      icon: '$updateBooking'
    }
  ]
})

const search = ref<string>('')

log('--- HomeContent.vue setup ---')
</script>

<template>
  <v-text-field
      v-model="search"
      :label="T.STRINGS.SEARCH_LABEL"
      density="compact"
      hide-details
      prepend-inner-icon="$magnify"
      single-line
      variant="outlined"/>
  <v-data-table
      :headers="T.HEADERS"
      :hide-no-data="false"
      :hover="true"
      :items="bookingItems"
      :items-per-page="bookingsPerPage"
      :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
      :no-data-text="T.STRINGS.NO_DATA_TEXT"
      :search="search"
      density="compact"
      item-key="cID"
      @update:items-per-page="setBookingsPerPage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu
              :menuItems="T.MENU_ITEMS"
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
