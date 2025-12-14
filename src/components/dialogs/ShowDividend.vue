<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import type {I_Header} from '@/types'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {d, n, t} = useI18n()
const {CONS, log} = useApp()
const settings = useSettingsStore()
const {dividendsPerPage} = storeToRefs(settings)
const {setDividendsPerPage} = settings
const {activeId} = useRuntimeStore()
const records = useRecordsStore()
const {isLoading} = useDialogGuards()

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: I_Header[] }>(
    {
        STRINGS: {
            TITLE: t('components.dialogs.showDividend.title'),
            ITEMS_PER_PAGE_TEXT: t('components.dialogs.showDividend.itemsPerPageText'),
            NO_DATA_TEXT: t('components.dialogs.showDividend.noDataText')
        },
        HEADERS: [
            {
                title: t('components.dialogs.showDividend.yearLabel'),
                align: 'start',
                sortable: false,
                key: 'year'
            },
            {
                title: t('components.dialogs.showDividend.sumLabel'),
                align: 'start',
                sortable: false,
                key: 'sum'
            }
        ]
    }
)

const title = T.STRINGS.TITLE
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
                    :headers="T.HEADERS"
                    :hide-no-data="false"
                    :hover="false"
                    :items="records.bookings.dividendsByStockId(activeId)"
                    :items-per-page="dividendsPerPage"
                    :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
                    :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
                    :no-data-text="T.STRINGS.NO_DATA_TEXT"
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
        <v-overlay
            v-model="isLoading"
            contained
            class="align-center justify-center">
            <v-progress-circular
                color="primary"
                indeterminate
                size="64"
            />
        </v-overlay>
    </v-form>
</template>
