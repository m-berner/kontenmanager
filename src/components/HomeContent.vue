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
import {type Reactive, reactive} from 'vue'

type TAlign = 'start' | 'center' | 'end' | undefined

type TMenuItem = {
  readonly id: string
  readonly title: string
  readonly icon?: string
}

type THeader = {
  readonly title: string
  readonly align: TAlign
  readonly sortable: boolean
  readonly key: string
}

interface IState {
  search: string
}

const {d, n, rt, t, tm} = useI18n()
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

// Convert reactive messages array into non-reactive array (no Proxies)
// noinspection TypeScriptValidateTypes
const headers = (tm('appPage.headers') as THeader[])?.map((item: THeader) => {
  return {
    title: rt(item.title ?? ''),
    align: rt(item.align ?? '') as TAlign,
    sortable: item.sortable,
    key: rt(item.key ?? '')
  }
})
// noinspection TypeScriptValidateTypes
const menuItems = (tm('appPage.menuItems') as TMenuItem[]).map((item) => {
  return {
    title: rt(item.title ?? ''),
    id: rt(item.id ?? ''),
    icon: rt(item.icon ?? '')
  }
})

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
    v-bind:headers="headers"
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
            v-bind:menuItems="menuItems"
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
