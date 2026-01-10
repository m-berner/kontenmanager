<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Header, I_Menu_Item} from '@/types'
import {computed, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import DotMenu from '@/components/DotMenu.vue'
import {useAppConfig} from '@/composables/useAppConfig'

const {d, n, t} = useI18n()
const {log} = useApp()
const {SETTINGS} = useAppConfig()
const records = useRecordsStore()
const {active: activeStockItems} = storeToRefs(records.stocks)
const settings = useSettingsStore()
const {stocksPerPage} = storeToRefs(settings)
const {setStocksPerPage} = settings
const runtime = useRuntimeStore()
const {stocksPage, isDownloading, isStockLoading} = storeToRefs(runtime)

const HEADERS: I_Header[] = [
    {
        title: t('screens.companyContent.stocksTable.headers.action'),
        align: 'start',
        sortable: false,
        key: 'mAction'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.company'),
        align: 'start',
        sortable: true,
        key: 'cCompany'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.isin'),
        align: 'start',
        sortable: false,
        key: 'cISIN'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.qf'),
        align: 'start',
        sortable: false,
        key: 'cQuarterDay'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.gm'),
        align: 'start',
        sortable: false,
        key: 'cMeetingDay'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.portfolio'),
        align: 'start',
        sortable: true,
        key: 'mPortfolio'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.winLoss'),
        align: 'start',
        sortable: false,
        key: 'mEuroChange'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.52low'),
        align: 'start',
        sortable: false,
        key: 'mMin'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.rate'),
        align: 'start',
        sortable: false,
        key: 'mValue'
    },
    {
        title: t('screens.companyContent.stocksTable.headers.52high'),
        align: 'start',
        sortable: false,
        key: 'mMax'
    }
]
const MENU_ITEMS: I_Menu_Item[] = [
    {
        id: 'update-stock',
        title: t('screens.companyContent.stocksTable.menuItems.update'),
        icon: '$showCompany',
        action: 'updateStock'
    },
    {
        id: 'show-dividend',
        title: t('screens.companyContent.stocksTable.menuItems.dividend'),
        icon: '$showDividend',
        action: 'showDividend'
    },
    {
        id: 'open-link',
        title: t('screens.companyContent.stocksTable.menuItems.link'),
        icon: '$link',
        action: 'openLink'
    },
    {
        id: 'delete-stock',
        title: t('screens.companyContent.stocksTable.menuItems.delete'),
        icon: '$deleteCompany',
        action: 'deleteStock',
        variant: 'danger'
    }
]

const winLossClass = computed(() => {
    return (value: number): Record<string, boolean> => ({
        'color-red font-weight-bold': value < 0,
        'color-black font-weight-bold': value >= 0
    })
})

const loadRequiredPages = async (startPage: number = 1): Promise<void> => {
    const pagesToLoad: number[] = []
    for (let page = startPage; page <= Math.ceil(records.stocks.active.length / stocksPerPage.value); page++) {
        const pageFirstIndex = stocksPerPage.value * (page - 1)
        if (records.stocks.active[pageFirstIndex].mPortfolio! < 0.9) break
        pagesToLoad.push(page)
    }
    await Promise.all(pagesToLoad.map(page => records.stocks.loadOnlineData(page)))
}

const onUpdatePage = async (page: number): Promise<void> => {
    log('COMPANY_CONTENT: onUpdatePage', page, 'info')
    stocksPage.value = page
    if (!runtime.loadedStocksPages.has(page)) {
        isStockLoading.value = true
        await records.stocks.loadOnlineData(page)
        isStockLoading.value = false
    }
}

onBeforeMount(async () => {
    log('COMPANY_CONTENT: onBeforeMount')

    if (!runtime.loadedStocksPages.has(stocksPage)) {
        isDownloading.value = true
        isStockLoading.value = true
        await loadRequiredPages(stocksPage.value)
        isStockLoading.value = false
        isDownloading.value = false
    }
})

log('--- CompanyContent.vue setup ---')
</script>

<template>
    <v-data-table
        :headers="HEADERS"
        :hide-no-data="false"
        :hover="true"
        :items="activeStockItems"
        :items-per-page="stocksPerPage"
        :items-per-page-options="SETTINGS.ITEMS_PER_PAGE_OPTIONS"
        :items-per-page-text="t('screens.companyContent.stocksTable.itemsPerPageText')"
        :loading="isStockLoading"
        :no-data-text="t('screens.companyContent.stocksTable.noDataText')"
        density="compact"
        item-key="cID"
        @update:items-per-page="setStocksPerPage"
        @update:page="onUpdatePage">
        <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
                <td class="d-none">{{ item.cID }}</td>
                <td>
                    <DotMenu
                        :items="MENU_ITEMS"
                        :record-id="item.cID!"/>
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
