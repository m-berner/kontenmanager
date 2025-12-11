<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import type {I_Account_Entry, I_Header} from '@/types'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const {sumsPerPage} = storeToRefs(settings)
const {setSumsPerPage} = settings
const {CONS, log} = useApp()

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: I_Header[] }>(
    {
        STRINGS: {
            TITLE: t('components.dialogs.showAccounting.title'),
            ITEMS_PER_PAGE_TEXT: t('components.dialogs.showAccounting.itemsPerPageText'),
            NO_DATA_TEXT: t('components.dialogs.showAccounting.noDataText'),
            FEES: t('components.dialogs.showAccounting.fees'),
            TAXES: t('components.dialogs.showAccounting.taxes'),
            SUM: t('components.dialogs.showAccounting.sum'),
            YEAR: t('components.dialogs.showAccounting.year'),
            ALL_YEARS: t('components.dialogs.showAccounting.allYears')
        },
        HEADERS: [
            {
                title: t('components.dialogs.showAccounting.nameLabel'),
                align: 'start',
                sortable: false,
                key: 'name'
            },
            {
                title: t('components.dialogs.showAccounting.sumLabel'),
                align: 'start',
                sortable: false,
                key: 'sum'
            }
        ]
    }
)

const selected = ref(CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID)

const yearEntries = computed(() => {
    const years = [CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID, ...Array.from(records.bookings.bookedYears)]
    return years.map((entry) => {
        return {
            id: entry,
            title: entry === CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID ? T.STRINGS.ALL_YEARS : entry.toString()
        }
    })
})

const accountEntries = computed(() => {
    const result: I_Account_Entry[] = []
    const {sums, taxes, fees} = getAccountData(selected.value)

    let finalSum = 0

    // Add individual booking type sums
    for (let i = 0; i < sums.length; i++) {
        const sumClass = sums[i].key < 0 ? 'color-red' : ''

        result.push(
            {
                id: i,
                name: sums[i].value,
                sum: sums[i].key,
                nameClass: '',
                sumClass
            }
        )
        finalSum += sums[i].key
    }

    // Add fees and taxes for depot accounts
    if (records.accounts.isDepot) {
        result.unshift(
            {
                id: sums.length + 2,
                name: T.STRINGS.FEES,
                sum: fees,
                nameClass: '',
                sumClass: 'color-red'
            }
        )
        result.unshift(
            {
                id: sums.length + 1,
                name: T.STRINGS.TAXES,
                sum: taxes,
                nameClass: '',
                sumClass: 'color-red'
            }
        )
    }

    // Add total sum
    result.push(
        {
            id: sums.length,
            name: T.STRINGS.SUM,
            sum: finalSum + taxes + fees,
            nameClass: 'font-weight-bold',
            sumClass: 'font-weight-bold'
        }
    )

    return result
})

const getAccountData = (year: number) => {
    if (year === CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID) {
        return {
            sums: records.bookings.sumBookingsPerType,
            taxes: records.bookings.sumAllTaxes,
            fees: records.bookings.sumAllFees
        }
    }

    return {
        sums: records.bookings.sumBookingsPerTypeAndYear(year),
        taxes: records.bookings.sumTaxes(year),
        fees: records.bookings.sumFees(year)
    }
}

const title = T.STRINGS.TITLE
defineExpose({title})

log('--- ShowAccounting.vue setup ---')
</script>

<template>
    <v-form
        validate-on="submit"
        @submit.prevent>
        <v-select
            v-model="selected"
            :items="yearEntries"
            :label="T.STRINGS.YEAR"
            clearable
            density="compact"
            item-title="title"
            item-value="id"
            max-width="300"
            variant="outlined"
        />
        <v-card>
            <v-card-text class="pa-5">
                <v-data-table
                    :headers="T.HEADERS"
                    :hide-no-data="false"
                    :hover="false"
                    :items="accountEntries"
                    :items-per-page="sumsPerPage"
                    :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
                    :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
                    :no-data-text="T.STRINGS.NO_DATA_TEXT"
                    density="compact"
                    item-key="id"
                    @update:items-per-page="setSumsPerPage">
                    <template v-slot:[`item`]="{ item }">
                        <tr class="table-row">
                            <td class="d-none">{{ item.id }}</td>
                            <td :class="item.nameClass">{{ item.name }}</td>
                            <td :class="item.sumClass">{{ n(item.sum, 'currency') }}</td>
                        </tr>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </v-form>
</template>
