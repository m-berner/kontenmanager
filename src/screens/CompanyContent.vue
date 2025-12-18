<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Header, I_Menu_Item, T_Menu_Action_Type} from '@/types'
import {computed, onBeforeMount, onBeforeUpdate} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import DotMenu from '@/components/DotMenu.vue'

const {d, n, t} = useI18n()
const {CONS, log} = useApp()
const records = useRecordsStore()
const {active: activeStockItems} = storeToRefs(records.stocks)
const settings = useSettingsStore()
const {stocksPerPage} = storeToRefs(settings)
const {setStocksPerPage} = settings
const runtime = useRuntimeStore()
const {stocksPage, isDownloading, isStockLoading} = storeToRefs(runtime)

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: I_Header[], MENU_ITEMS: I_Menu_Item[] }>(
    {
        STRINGS: {
            ITEMS_PER_PAGE_TEXT: t('companyContent.stocksTable.itemsPerPageText'),
            NO_DATA_TEXT: t('companyContent.stocksTable.noDataText')
        },
        HEADERS: [
            {
                title: t('companyContent.stocksTable.headers.action'),
                align: 'start',
                sortable: false,
                key: 'mAction'
            },
            {
                title: t('companyContent.stocksTable.headers.company'),
                align: 'start',
                sortable: true,
                key: 'cCompany'
            },
            {
                title: t('companyContent.stocksTable.headers.isin'),
                align: 'start',
                sortable: false,
                key: 'cISIN'
            },
            {
                title: t('companyContent.stocksTable.headers.qf'),
                align: 'start',
                sortable: false,
                key: 'cQuarterDay'
            },
            {
                title: t('companyContent.stocksTable.headers.gm'),
                align: 'start',
                sortable: false,
                key: 'cMeetingDay'
            },
            {
                title: t('companyContent.stocksTable.headers.portfolio'),
                align: 'start',
                sortable: true,
                key: 'mPortfolio'
            },
            {
                title: t('companyContent.stocksTable.headers.winLoss'),
                align: 'start',
                sortable: false,
                key: 'mEuroChange'
            },
            {
                title: t('companyContent.stocksTable.headers.52low'),
                align: 'start',
                sortable: false,
                key: 'mMin'
            },
            {
                title: t('companyContent.stocksTable.headers.rate'),
                align: 'start',
                sortable: false,
                key: 'mValue'
            },
            {
                title: t('companyContent.stocksTable.headers.52high'),
                align: 'start',
                sortable: false,
                key: 'mMax'
            }
        ],
        MENU_ITEMS: [
            {
                id: 'update-stock',
                title: t('companyContent.stocksTable.menuItems.update'),
                icon: '$showCompany',
                action: 'updateStock'
            },
            {
                id: 'show-dividend',
                title: t('companyContent.stocksTable.menuItems.dividend'),
                icon: '$showDividend',
                action: 'showDividend'
            },
            {
                id: 'open-link',
                title: t('companyContent.stocksTable.menuItems.link'),
                icon: '$link',
                action: 'openLink'
            },
            {
                id: 'delete-stock',
                title: t('companyContent.stocksTable.menuItems.delete'),
                icon: '$deleteCompany',
                action: 'deleteStock',
                variant: 'danger'
            }
        ]
    }
)

const winLossClass = computed(() => {
    return (value: number): Record<string, boolean> => ({
        'color-red font-weight-bold': value < 0,
        'color-black font-weight-bold': value >= 0
    })
})

// Optional: Custom action handler
const handleCustomAction = (action: T_Menu_Action_Type, recordId: number) => {
    console.log(`Custom handling for ${action} on ${recordId}`)
}

const loadRequiredPages = async (startPage: number = 1): Promise<void> => {
    const pagesToLoad: number[] = []

    for (let page = startPage; page < Math.ceil(records.stocks.active.length / stocksPerPage.value); page++) {
        const index = stocksPerPage.value * (page - 1)
        if (index >= records.stocks.active.length) break

        if ((records.stocks.active[index].mPortfolio!) > 0.9) {
            pagesToLoad.push(Math.ceil(index / stocksPerPage.value) + 1)
        }
    }
    // Load all pages concurrently with a limit
    const CONCURRENT_LIMIT = 3
    for (let i = 0; i < pagesToLoad.length; i += CONCURRENT_LIMIT) {
        const batch = pagesToLoad.slice(i, i + CONCURRENT_LIMIT)
        await Promise.all(batch.map(page => records.stocks.loadOnlineData(page)))
    }
}

const onUpdatePage = async (page: number): Promise<void> => {
    log('COMPANY_CONTENT: onUpdatePage', {info: page})
    stocksPage.value = page
    if (!runtime.loadedStocksPages.has(page)) {
        isStockLoading.value = true
        await records.stocks.loadOnlineData(page)
        isStockLoading.value = false
    }
}

onBeforeUpdate(() => {
    log('COMPANY_CONTENT: onBeforeUpdate')
})

onBeforeMount(async () => {
    log('COMPANY_CONTENT: onBeforeMount')

    if (!runtime.loadedStocksPages.has(stocksPage)) {
        isDownloading.value = true
        isStockLoading.value = true
        //await records.stocks.loadOnlineData(stocksPage.value)
        //await requiredOnlineData()
        await loadRequiredPages(stocksPage.value)
        isStockLoading.value = false
        isDownloading.value = false
    }
})

log('--- CompanyContent.vue setup ---')
</script>

<template>
    <v-data-table
        :headers="T.HEADERS"
        :hide-no-data="false"
        :hover="true"
        :items="activeStockItems"
        :items-per-page="stocksPerPage"
        :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
        :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
        :loading="isStockLoading"
        :no-data-text="T.STRINGS.NO_DATA_TEXT"
        density="compact"
        item-key="cID"
        @update:items-per-page="setStocksPerPage"
        @update:page="onUpdatePage">
        <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
                <td class="d-none">{{ item.cID }}</td>
                <td>
                    <DotMenu
                        :items="T.MENU_ITEMS"
                        :record-id="item.cID!"
                        :on-action="handleCustomAction"/>
                </td>
                <td>{{ item.cCompany }}</td>
                <td>{{ item.cISIN }}</td>
                <td v-if="new Date(item.cQuarterDay).getTime() > 0">{{ d(new Date(item.cQuarterDay), 'short') }}</td>
                <td v-else/>
                <td v-if="new Date(item.cMeetingDay).getTime() > 0">{{ d(new Date(item.cMeetingDay), 'short') }}</td>
                <td v-else/>
                <td v-if="(item.mPortfolio ?? 0) >= 1">{{ item.mPortfolio }}</td>
                <td v-else/>
                <v-tooltip
                    :text="n((item.mInvest !== 0 && item.mInvest !== undefined )? (item.mEuroChange ?? 0) / item.mInvest : 1, 'percent')"
                    location="left">
                    <template v-slot:activator="{ props }">
                        <td v-if="(item.mPortfolio ?? 0) >= 1"
                            :class="winLossClass((item.mEuroChange!))"
                            v-bind="props">
                            {{ n(item.mEuroChange ?? 0, 'currency') }}
                        </td>
                        <td v-else/>
                    </template>
                </v-tooltip>
                <td>{{ n(item.mMin ?? 0, 'currency') }}</td>
                <td class="font-weight-bold color-black">
                    {{ n(item.mValue ?? 0, 'currency3') }}
                </td>
                <td>{{ n(item.mMax ?? 0, 'currency') }}</td>
            </tr>
        </template>
    </v-data-table>
</template>
