<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IMenuItem} from 'types.d'
import type {DataTableHeader} from 'vuetify'
import type {ComputedRef, Ref} from 'vue'
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useApp} from '@/composables/useApp'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import DotMenu from '@/components/childs/DotMenu.vue'

const {d, n, t} = useI18n()
const {CONS} = useConstant()
const {utcDate} = useApp()
const {log} = useNotification()
const records = useRecordsStore()
const settings = useSettingsStore()
const homeHeaders: ComputedRef<DataTableHeader[]> = computed(() => [
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
const homeMenuItems: ComputedRef<IMenuItem[]> = computed(() => [
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

const search: Ref<string> = ref('')

const onUpdateItemsPerPage = (count: number): void => {
  settings.bookingsPerPage = (count)
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
      variant="outlined"
  />
  <v-data-table
      :headers="homeHeaders"
      :hide-no-data="false"
      :hover="true"
      :items="records.bookings.items"
      :items-per-page="settings.bookingsPerPage"
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
              :recordID="item.cID"
          />
        </td>
        <td>{{ d(utcDate(item.cDate), 'short') }}</td>
        <td>{{ n(item.cDebit, 'currency') }}</td>
        <td>{{ n(item.cCredit, 'currency') }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.bookingTypes.getBookingTypeNameById(item.cBookingTypeID) }}</td>
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
