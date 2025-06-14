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
import OptionMenu from '@/components/OptionMenu.vue'
import {reactive} from 'vue'

interface IHeader {
  title: string,
  align: string,
  sortable: boolean,
  key: string
}

const {d, n, rt, t, tm} = useI18n()
const {CONS, log, utcDate} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()

const {_bookings} = storeToRefs(records)
const {_bookings_per_page} = storeToRefs(settings)

const state = reactive({
  _search: ''
})

log('--- HomeContent.vue setup ---')
</script>

<template>
  <v-text-field
    v-model="state._search"
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
    v-bind:headers="tm('appPage.headers').map((item: IHeader): IHeader => {
    return {
      title: rt(item.title),
      align: rt(item.align),
      sortable: item.sortable,
      key: rt(item.key)
    }
  })"
    v-bind:hide-no-data="false"
    v-bind:hover="true"
    v-bind:items="_bookings"
    v-bind:items-per-page="_bookings_per_page"
    v-bind:items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
    v-bind:items-per-page-text="t('appPage.itemsPerPageText')"
    v-bind:no-data-text="t('appPage.noDataText')"
    v-bind:search="state._search"
    v-on:update:items-per-page="(count) => { settings.setBookingsPerPage(count) }">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td>
          <OptionMenu
            v-bind:menuItems="tm('appPage.menuItems')"
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
