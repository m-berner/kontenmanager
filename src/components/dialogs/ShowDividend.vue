<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {UtilsService} from '@/domains/utils'
import {createDividendHeaders, VIEWS} from '@/config/views'

const {d, n, t} = useI18n()
const settings = useSettingsStore()
const {dividendsPerPage} = storeToRefs(settings)
const {setDividendsPerPage} = settings
const {activeId} = useRuntimeStore()
const records = useRecordsStore()

const HEADERS = createDividendHeaders(t)

defineExpose({title: t('components.dialogs.showDividend.title')})

UtilsService.log('--- ShowDividend.vue setup ---')
</script>

<template>
    <v-form
        validate-on="submit"
        @submit.prevent>
        <v-card>
            <v-card-text class="pa-5">
                <v-data-table
                    :headers="HEADERS"
                    :hide-no-data="false"
                    :hover="false"
                    :items="records.bookings.dividendsByStockId(activeId)"
                    :items-per-page="dividendsPerPage"
                    :items-per-page-options="VIEWS.ITEMS_PER_PAGE_OPTIONS"
                    :items-per-page-text="t('components.dialogs.showDividend.itemsPerPageText')"
                    :no-data-text="t('components.dialogs.showDividend.noDataText')"
                    density="compact"
                    item-key="id"
                    @update:items-per-page="setDividendsPerPage">
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
