<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
/**
 * @fileoverview CompanyContent component displays a data table of stock holdings
 * with real-time market data, portfolio information, and interactive menu actions.
 */
import {computed, onBeforeMount, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {UtilsService} from '@/domains/utils'
import {DomainLogic} from '@/domains/logic'
import DotMenu from '@/components/DotMenu.vue'
import {VIEWS} from '@/config/views'
import {DATE} from '@/domains/config/date'
import {createCompanyHeaders, createCompanyMenuItems} from '@/config/views'

const {d, n, t} = useI18n()
const records = useRecordsStore()
const {active: activeStockItems} = storeToRefs(records.stocks)
const settings = useSettingsStore()
const {stocksPerPage} = storeToRefs(settings)
const {setStocksPerPage} = settings
const runtime = useRuntimeStore()
const {stocksPage, isDownloading, isStockLoading} = storeToRefs(runtime)

const HEADERS = createCompanyHeaders(t)
const MENU_ITEMS = createCompanyMenuItems(t)

/**
 * Computed function that returns CSS classes for profit/loss display.
 * Applies red color for negative values and black for positive/zero values.
 *
 * @returns {Function} Function that takes a value and returns CSS class map
 *
 * @example
 * winLossClass()(-100) // { 'color-red font-weight-bold': true, ... }
 * winLossClass()(250) // { 'color-black font-weight-bold': true, ... }
 */
const winLossClass = computed(() => {
    return (value: number): Record<string, boolean> => ({
        'color-red font-weight-bold': value < 0,
        'color-black font-weight-bold': value >= 0
    })
})

/**
 * Validates whether a date string represents a valid date after the epoch.
 *
 * @param {string} dateString - ISO date string to validate
 * @returns {boolean} True if the date is valid and after epoch time (0)
 *
 * @example
 * isValidDate('2024-01-15') // returns true
 * isValidDate('1970-01-01') // returns false (epoch time)
 */
const isValidDate = (dateString: string): boolean => {
    return new Date(dateString).getTime() > DATE.ZERO_TIME
}

/**
 * Checks if a stock has a meaningful portfolio holding (>= 1 share).
 *
 * @param {number | undefined} portfolio - Number of shares held
 * @returns {boolean} True if portfolio contains at least 0.1 share
 *
 * @example
 * hasPortfolio(10) // returns true
 * hasPortfolio(0.5) // returns true
 * hasPortfolio(undefined) // returns false
 */
const hasPortfolio = (portfolio: number | undefined): boolean => {
    return (portfolio ?? 0) >= 0.1
}

/**
 * Calculates the percentage change between investment and current value.
 * Returns 1 (100%) if the investment is zero to avoid division by zero.
 *
 * @param {number | undefined} euroChange - Absolute change in euros
 * @param {number | undefined} invest - Original investment amount
 * @returns {number} Percentage change as decimal (0.15 = 15%)
 *
 * @example
 * calculatePercentChange(150, 1000) // returns 0.15 (15% gain)
 * calculatePercentChange(-50, 500) // returns -0.1 (10% loss)
 * calculatePercentChange(100, 0) // returns 0 (fallback)
 */
const calculatePercentChange = (euroChange: number | undefined, invest: number | undefined): number => {
    if (!invest || invest === 0) return 0
    return (euroChange ?? 0) / invest
}

/**
 * Loads online market data for all required pages starting from a given page.
 * Continues loading consecutive pages as long as stocks have portfolio holdings >= 0.1.
 * Uses parallel requests for optimal performance.
 *
 * @async
 * @param {number} [startPage=1] - First page index to load (1-based)
 * @returns {Promise<void>}
 *
 * @example
 * await loadRequiredPages(1) // Load from page 1 until portfolios drop below 0.1
 * await loadRequiredPages(3) // Resume loading from page 3
 */
const loadRequiredPages = async (startPage: number = 1): Promise<void> => {
    const pagesToLoad: number[] = []
    const totalPages = Math.ceil(activeStockItems.value.length / stocksPerPage.value)

    for (let page = startPage; page <= totalPages; page++) {
        const pageFirstIndex = stocksPerPage.value * (page - 1)
        const stock = activeStockItems.value[pageFirstIndex]

        if (!stock || !hasPortfolio(stock.mPortfolio)) break

        pagesToLoad.push(page)
    }

    await Promise.all(pagesToLoad.map(page => records.stocks.loadOnlineData(page)))
}

/**
 * Event handler for page navigation in the data table.
 * Loads online market data for the new page if not already cached.
 * Manages loading state to prevent duplicate requests.
 *
 * @async
 * @param {number} page - Target page number (1-based index)
 * @returns {Promise<void>}
 *
 * @example
 * await onUpdatePage(2) // Navigate to page 2 and load data if needed
 */
const onUpdatePage = async (page: number): Promise<void> => {
    UtilsService.log('COMPANY_CONTENT: onUpdatePage', page, 'info')
    stocksPage.value = page

    if (runtime.loadedStocksPages.has(page)) return

    isStockLoading.value = true
    try {
        await records.stocks.loadOnlineData(page)
    } finally {
        isStockLoading.value = false
    }
}

/**
 * Component initialization hook.
 * Loads online market data for the current page and all further pages
 * with portfolio holdings if not already loaded. Manages global loading states.
 *
 * @async
 * @returns {Promise<void>}
 */
onBeforeMount(async () => {
    UtilsService.log('COMPANY_CONTENT: onBeforeMount')

    // Always recalculate portfolio values from bookings upon entry
    // to ensure RAM-only properties (mPortfolio, mInvest) are up to date.
    records.stocks.items.forEach(stock => {
        if (stock.cID > 0) {
            stock.mPortfolio = DomainLogic.calculatePortfolioByStockId(records.bookings.items, stock.cID)
            stock.mInvest = DomainLogic.calculateInvestByStockId(records.bookings.items, stock.cID)
        }
    })

    if (!runtime.loadedStocksPages.has(stocksPage.value)) {
        isDownloading.value = true
        isStockLoading.value = true
        try {
            await loadRequiredPages(stocksPage.value)
        } finally {
            isStockLoading.value = false
            isDownloading.value = false
        }
    } else {
        // If the page is already cached, we still need to trigger a recalculation
        // of RAM-only properties (mEuroChange, etc.) that might have been lost
        // if the store was partially re-initialized or if we want to ensure UI consistency.
        // Actually, Pinia store should be persistent, but recalculating derived RAM state is safe.
        activeStockItems.value.forEach(stock => {
            if (stock.mValue) {
                stock.mEuroChange = (stock.mValue * (stock.mPortfolio ?? 0)) - (stock.mInvest ?? 0)
            }
        })
    }
})

/**
 * Watcher for stocksPerPage.
 * Reloads online market data when the number of items per page changes,
 * as this affects page boundaries and which stocks need loading.
 */
watch(
    stocksPerPage,
    async () => {
        runtime.clearStocksPages()
        isDownloading.value = true
        isStockLoading.value = true
        try {
            await loadRequiredPages(stocksPage.value)
        } finally {
            isStockLoading.value = false
            isDownloading.value = false
        }
    })

UtilsService.log('--- views/CompanyContent.vue setup ---')
</script>

<template>
    <v-data-table
        :headers="HEADERS"
        :hide-no-data="false"
        :hover="true"
        :items="activeStockItems"
        :items-per-page="stocksPerPage"
        :items-per-page-options="VIEWS.ITEMS_PER_PAGE_OPTIONS"
        :items-per-page-text="t('views.companyContent.stocksTable.itemsPerPageText')"
        :loading="isStockLoading"
        :no-data-text="t('views.companyContent.stocksTable.noDataText')"
        density="compact"
        item-key="cID"
        @update:items-per-page="setStocksPerPage"
        @update:page="onUpdatePage">
        <template #item="{ item }">
            <tr class="table-row">
                <td class="d-none">{{ item.cID }}</td>
                <td>
                    <DotMenu
                        :items="MENU_ITEMS"
                        :record-id="item.cID!"/>
                </td>
                <td>{{ item.cCompany }}</td>
                <td>{{ item.cISIN }}</td>
                <td>
                    <template v-if="isValidDate(item.cQuarterDay)">
                        {{ d(new Date(item.cQuarterDay), 'short') }}
                    </template>
                </td>
                <td>
                    <template v-if="isValidDate(item.cMeetingDay)">
                        {{ d(new Date(item.cMeetingDay), 'short') }}
                    </template>
                </td>
                <td>
                    <template v-if="hasPortfolio(item.mPortfolio)">
                        {{ item.mPortfolio }}
                    </template>
                </td>
                <td>
                    <v-tooltip
                        v-if="hasPortfolio(item.mPortfolio)"
                        :text="n(calculatePercentChange(item.mEuroChange, item.mInvest), 'percent')"
                        location="left">
                        <template #activator="{ props }">
                            <span
                                :class="winLossClass(item.mEuroChange!)"
                                v-bind="props">
                                {{ n(item.mEuroChange ?? 0, 'currency') }}
                            </span>
                        </template>
                    </v-tooltip>
                </td>
                <td>{{ n(item.mMin ?? 0, 'currency') }}</td>
                <td class="font-weight-bold color-black">
                    {{ n(item.mValue ?? 0, 'currency3') }}
                </td>
                <td>{{ n(item.mMax ?? 0, 'currency') }}</td>
            </tr>
        </template>
    </v-data-table>
</template>
