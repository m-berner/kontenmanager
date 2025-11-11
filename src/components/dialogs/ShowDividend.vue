<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {DataTableHeader} from 'vuetify'
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'

const {d, n, t} = useI18n()
const {CONS, log} = useApp()
const {dividendsPerPage} = useSettingsStore()
const {activeId} = useRuntimeStore()
const records = useRecordsStore()

const dividendsHeaders: readonly DataTableHeader[] = Object.freeze([
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
            :items="records.bookings.dividendsByStockId(activeId)"
            :items-per-page="dividendsPerPage"
            :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('dialogs.showDividend.itemsPerPageText')"
            :no-data-text="t('dialogs.showDividend.noDataText')"
            density="compact"
            item-key="id">
          <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
              <td class="d-none">{{ item.id }}</td>
              <td>{{ d(item.year, 'short') }}</td>
              <td>{{ n(item.sum, 'currency') }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
