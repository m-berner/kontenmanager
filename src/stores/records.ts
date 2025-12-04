/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {
    IAccount_Store,
    IBooking_Store,
    IBookingType_Store,
    IStock_DB,
    IStock_Memory,
    IStock_Store,
    IStores_DB,
    IStores_Store
} from '@/types'
import {defineStore, storeToRefs} from 'pinia'
import {computed, ref} from 'vue'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useAlertStore} from '@/stores/alerts'
import {useFetch} from '@/composables/useFetch'
import {useRuntimeStore} from '@/stores/runtime'

const {CONS, isoDate, toNumber, utcDate, log} = useApp()

const useStocksStore = defineStore('stocks', function () {
    const items = ref<IStock_Store[]>([])

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(stock => stock.cID === id)
    })
    const getItemById = computed(() => (id: number): IStock_Store => items.value[getIndexById.value(id)])
    const passive = computed(() => {
        return items.value.filter(rec => {
            return rec.cFadeOut === 1 && rec.cID > 0
        })
    })
    const active = computed(() => {
        return items.value.filter(rec => {
            return rec.cFadeOut === 0 && rec.cID > 0
        })
    })
    const sumDepot = computed(() => (): number => {
        return active.value.map(rec => {
            return (rec.mPortfolio ?? 0) * (rec.mValue ?? 0)
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })

    function add(stock: IStock_DB, prepend: boolean = false): void {
        log('STOCKS_STORE: add')
        const stocksOnlyMemory: IStock_Memory = {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false
        }
        const completeStock = {
            ...stock,
            ...stocksOnlyMemory
        }
        if (prepend) {
            items.value.unshift(completeStock)
        } else {
            items.value.push(completeStock)
        }
    }

    function update(stock: IStock_DB): void {
        log('STOCKS_STORE: updateStock', {info: stock})
        const index = getIndexById.value(stock?.cID ?? -1)
        if (index !== -1) {
            const stocksOnlyMemory = {
                mPortfolio: items.value[index].mPortfolio,
                mInvest: items.value[index].mInvest,
                mChange: items.value[index].mChange,
                mBuyValue: items.value[index].mBuyValue,
                mEuroChange: items.value[index].mEuroChange,
                mMin: items.value[index].mMin,
                mValue: items.value[index].mValue,
                mMax: items.value[index].mMax,
                mDividendYielda: items.value[index].mDividendYielda,
                mDividendYeara: items.value[index].mDividendYeara,
                mDividendYieldb: items.value[index].mDividendYieldb,
                mDividendYearb: items.value[index].mDividendYearb,
                mRealDividend: items.value[index].mRealDividend,
                mRealBuyValue: items.value[index].mRealBuyValue,
                mDeleteable: items.value[index].mDeleteable
            }
            items.value[index] = {...stock, ...stocksOnlyMemory}
        }
    }

    function remove(ident: number): void {
        log('STOCKS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        log('STOCKS_STORE: clean')
        items.value.length = 0
    }

    async function loadOnlineData(page: number) {
        log('INDEXED_DB/STOCKS: loadOnlineData')
        const {fetchDateData, fetchMinRateMaxData} = useFetch()
        const {loadedStocksPages} = useRuntimeStore()
        const runtime = useRuntimeStore()
        const {curEur, curUsd} = storeToRefs(runtime)
        const settings = useSettingsStore()
        const {stocksPerPage} = storeToRefs(settings)
        const {CONS} = useApp()
        const isin = []
        const isinDates = []
        const itemsLength = active.value.length
        const rest = itemsLength % stocksPerPage.value
        const lastPage = Math.ceil(itemsLength / stocksPerPage.value)

        let pageStocks: IStock_Store[] = []
        if (itemsLength > 0) {
            if (page < lastPage || rest === 0) {
                pageStocks = active.value.slice(
                    (page - 1) * stocksPerPage.value,
                    (page - 1) * stocksPerPage.value + stocksPerPage.value
                )
            } else {
                pageStocks = active.value.slice(
                    (page - 1) * stocksPerPage.value,
                    (page - 1) * stocksPerPage.value + rest
                )
            }
            for (let i = 0; i < pageStocks.length; i++) {
                //if (pageStocks[i].mValue === 0) {
                isin.push({
                    id: pageStocks[i].cID,
                    isin: pageStocks[i].cISIN,
                    min: '0',
                    rate: '0',
                    max: '0',
                    cur: ''
                })
                //}
                if ((utcDate(pageStocks[i].cMeetingDay).getTime() < Date.now() || utcDate(pageStocks[i].cQuarterDay).getTime() < Date.now()) && utcDate(pageStocks[i].cAskDates).getTime() < Date.now()) {
                    isinDates.push({
                        id: pageStocks[i].cID,
                        isin: pageStocks[i].cISIN
                    })
                }
            }
        }
        const minRateMaxResponse = await fetchMinRateMaxData(isin)
        const dateResponse = await fetchDateData(isinDates)
        for (let i = 0; i < pageStocks.length; i++) {
            pageStocks[i].mMin = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].min) / curUsd.value : toNumber(minRateMaxResponse[i].min) / curEur.value
            pageStocks[i].mValue = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].rate) / curUsd.value : toNumber(minRateMaxResponse[i].rate) / curEur.value
            pageStocks[i].mMax = minRateMaxResponse[i].cur === 'USD' ? toNumber(minRateMaxResponse[i].max) / curUsd.value : toNumber(minRateMaxResponse[i].max) / curEur.value
            pageStocks[i].mEuroChange = (pageStocks[i].mValue ?? 0) * (pageStocks[i].mPortfolio ?? 0) - (pageStocks[i].mInvest ?? 0)
            for (let j = 0; isinDates.length > 0 && j < isinDates.length && pageStocks[i].cID === isinDates[j].id; j++) {
                pageStocks[i].cMeetingDay = (await dateResponse[j]).value.gm > 0 ? isoDate((await dateResponse[j]).value.gm) : CONS.DATE.DEFAULT_ISO
                pageStocks[i].cQuarterDay = (await dateResponse[j]).value.qf > 0 ? isoDate((await dateResponse[j]).value.qf) : CONS.DATE.DEFAULT_ISO
                pageStocks[i].cAskDates = isoDate(Date.now() + CONS.DEFAULTS.ASK_DATE_INTERVAL * 86400000)
            }
            update({...pageStocks[i]})
        }
        loadedStocksPages.add(page)
    }

    return {
        items,
        getItemById,
        getIndexById,
        active,
        passive,
        sumDepot,
        add,
        update,
        remove,
        clean,
        loadOnlineData
    }
})

const useAccountsStore = defineStore('accounts', function () {
    const settings = useSettingsStore()
    const {activeAccountId} = storeToRefs(settings)

    const items = ref<IAccount_Store[]>([])

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(account => account.cID === id)
    })
    const getById = computed(() => (id: number): IAccount_Store | undefined => {
        return items.value.find(account => account.cID === id)
    })
    const isDuplicate = computed(() => (name: string): boolean => {
        const duplicates = items.value.filter((entry: IAccount_Store) => entry.cIban === name)
        return duplicates.length > 0
    })
    const isDepot = computed((): boolean => {
        const ind = getIndexById.value(activeAccountId.value)
        if (ind > -1) {
            return items.value[ind].cWithDepot
        } else {
            return false
        }
    })

    function add(account: IAccount_Store, prepend: boolean = false): void {
        log('ACCOUNTS_STORE: add')
        if (prepend) {
            items.value.unshift(account)
        } else {
            items.value.push(account)
        }
    }

    function update(account: IAccount_Store): void {
        log('ACCOUNTS_STORE: update')
        const index = getIndexById.value(account.cID)
        if (index !== -1) {
            items.value[index] = {...account}
        }
    }

    function remove(ident: number): void {
        log('ACCOUNTS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean() {
        log('ACCOUNTS_STORE: clean')
        items.value.length = 0
    }

    return {
        items,
        getById,
        getIndexById,
        isDuplicate,
        isDepot,
        add,
        update,
        remove,
        clean
    }
})

const useBookingsStore = defineStore('bookings', function () {
    const items = ref<IBooking_Store[]>([])

    const getById = computed(() => (id: number): IBooking_Store | undefined => {
        return items.value.find(account => account.cID === id)
    })
    const getIndexById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IBooking_Store) => entry.cID === ident)
    })
    const getTextById = computed(() => (ident: number): string => {
        const booking = items.value.find((entry: IBooking_Store) => entry.cID === ident)
        if (booking) {
            return `${booking.cBookDate} : ${booking.cDebit} : ${booking.cCredit}`
        } else {
            throw new Error('getTextById: No booking found for given ID')
        }
    })
    const sumBookings = computed(() => (): number => {
        const settings = useSettingsStore()
        const {activeAccountId} = storeToRefs(settings)

        if (activeAccountId.value === -1) {
            return 0
        }

        if (items.value.length > 0) {
            return items.value
                .map((entry: IBooking_Store) => {
                    const fees = entry.cTaxDebit - entry.cTaxCredit + entry.cSourceTaxDebit - entry.cSourceTaxCredit + entry.cTransactionTaxDebit - entry.cTransactionTaxCredit + entry.cSoliDebit - entry.cSoliCredit + entry.cFeeDebit - entry.cFeeCredit
                    const balance = entry.cCredit - entry.cDebit
                    return balance - fees
                })
                .reduce((acc: number, cur: number) => acc + cur, 0)
        } else {
            return 0
        }
    })
    const hasBookingType = computed(() => (ident: number): boolean => {
        const findings = items.value.filter((entry: IBooking_Store) => entry.cBookingTypeID === ident)
        return findings.length > 0
    })
    const sumFees = computed(() => {
        return items.value.map((entry: IBooking_Store) => {
            // if (entry.cBookingTypeID === 5) {
            //     return entry.cCredit - entry.cDebit
            // }
            return entry.cFeeCredit - entry.cFeeDebit
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const sumTaxes = computed(() => {
        return items.value.map((entry: IBooking_Store) => {
            return entry.cTaxCredit - entry.cTaxDebit + entry.cSoliCredit - entry.cSoliDebit + entry.cSourceTaxCredit - entry.cSourceTaxDebit + entry.cTransactionTaxCredit - entry.cTransactionTaxDebit
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const sumBookingTypes = computed(() => {
        const bt = useBookingTypesStore()
        const sums: number[] = []
        for (let i = 1; i < bt.items.length; i++) {
            sums[i - 1] = items.value.filter((entry: IBooking_Store) => {
                return entry.cBookingTypeID === bt.items[i].cID
            }).map((entry: IBooking_Store) => {
                return entry.cCredit - entry.cDebit
            }).reduce((acc: number, cur: number) => acc + cur, 0)
        }
        return sums
    })
    const portfolioByStockId = computed(() => (ident: number) => {
        const bought = items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1
        }).map((entry: IBooking_Store) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        const sold = items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 2
        }).map((entry: IBooking_Store) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        return bought - sold
    })
    const investByStockId = computed(() => (ident: number) => {
        let portfolio = 0
        return items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1
        }).map((entry: IBooking_Store) => {
            portfolio += entry.cCount
            if (portfolio <= portfolioByStockId.value(ident)) {
                return entry.cDebit
            } else {
                return 0
            }
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const dividendsByStockId = computed(() => (ident: number) => {
        return items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 3
        }).map((entry: IBooking_Store) => {
            return {id: ident, year: entry.cExDate, sum: entry.cCredit}
        })
    })

    function add(booking: IBooking_Store, prepend: boolean = false): void {
        log('BOOKINGS_STORE: add')
        if (prepend) {
            items.value.unshift(booking)
        } else {
            items.value.push(booking)
        }
    }

    function update(booking: IBooking_Store): void {
        log('BOOKINGS_STORE: update')
        const index = getIndexById.value(booking?.cID ?? -1)
        if (index !== -1) {
            items.value[index] = {...booking}
        }
    }

    function remove(ident: number): void {
        log('BOOKINGS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        log('BOOKINGS_STORE: clean')
        items.value.length = 0
    }

    function set(bookings: IBooking_Store[]): void {
        items.value = bookings
    }

    return {
        items,
        getById,
        getIndexById,
        getTextById,
        sumBookings,
        sumFees,
        sumTaxes,
        sumBookingTypes,
        hasBookingType,
        portfolioByStockId,
        investByStockId,
        dividendsByStockId,
        add,
        update,
        remove,
        set,
        clean
    }
})

const useBookingTypesStore = defineStore('bookingTypes', function () {
    const items = ref<IBookingType_Store[]>([])

    const getNameById = computed(() => (ident: number): string => {
        const bookingType = items.value.find((entry: IBookingType_Store) => entry.cID === ident)
        return bookingType ? bookingType.cName : ''
    })
    const getById = computed(() => (ident: number): IBookingType_Store | null => {
        const bookingType = items.value.find((entry: IBookingType_Store) => entry.cID === ident)
        return bookingType ? bookingType : null
    })
    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(bookingType => bookingType.cID === id)
    })
    const isDuplicate = computed(() => (name: string): boolean => {
        const duplicates = items.value.filter((entry: IBookingType_Store) => entry.cName === name)
        return duplicates.length > 0
    })
    const getNames = computed(() => items.value.map(item => item.cName))
    const getNamesWithIndex = computed(() => items.value.map((item, index) => ({
        name: item.cName,
        index
    })))

    function add(bookingType: IBookingType_Store, prepend: boolean = false): void {
        log('BOOKING_TYPES_STORE: add')
        if (prepend) {
            items.value.unshift(bookingType)
        } else {
            items.value.push(bookingType)
        }
    }

    function update(bookingType: IBookingType_Store): void {
        log('BOOKING_TYPES_STORE: update')
        const index = getIndexById.value(bookingType.cID)
        if (index !== -1) {
            items.value[index] = {...bookingType}
        }
    }

    function remove(ident: number): void {
        log('BOOKING_TYPE_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        log('BOOKING_TYPES_STORE: clean')
        items.value.length = 0
    }

    return {
        items,
        getById,
        getNameById,
        getIndexById,
        getNames,
        getNamesWithIndex,
        isDuplicate,
        add,
        remove,
        update,
        clean
    }
})

export const useRecordsStore = defineStore('records', function () {
    const accountsStore = useAccountsStore()
    const bookingsStore = useBookingsStore()
    const bookingTypesStore = useBookingTypesStore()
    const stocksStore = useStocksStore()

    function clean(all = true) {
        log('RECORDS: clean')
        if (all) {
            accountsStore.clean()
        }
        bookingsStore.clean()
        bookingTypesStore.clean()
        stocksStore.clean()
    }

    async function init(storesDB: IStores_DB, messages: Record<string, string>, removeAccounts = true): Promise<void> {
        log('RECORDS: init', {info: storesDB})
        const settings = useSettingsStore()
        const {activeAccountId} = storeToRefs(settings)
        const {info} = useAlertStore()
        const stocksOnlyMemory: IStock_Memory = {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false
        }
        const stores: IStores_Store = {
            accounts: storesDB.accountsDB,
            bookings: storesDB.bookingsDB,
            bookingTypes: storesDB.bookingTypesDB,
            stocks: storesDB.stocksDB.map((stock) => {
                return {...stock, ...stocksOnlyMemory}
            })
        }
        const load = (stores: IStores_Store) => {
            log('RECORDS: load', {info: stores})
            for (const entry of stores.accounts) {
                accountsStore.add(entry)
            }
            //accountsStore.add({cID: 0, cSwift: '', cIban: '', cLogoUrl: '', cWithDepot: false}, true)

            for (const entry of stores.bookings) {
                bookingsStore.add(entry)
            }

            for (const entry of stores.bookingTypes) {
                bookingTypesStore.add(entry)
            }

            for (const entry of stores.stocks) {
                stocksStore.add(entry)
            }

            stocksStore.items.sort((a: IStock_Store, b: IStock_Store) => {
                return b.cFirstPage - a.cFirstPage
            })
            bookingsStore.items.sort((a: IBooking_Store, b: IBooking_Store) => {
                const dateA = new Date(a.cBookDate).getTime()
                const dateB = new Date(b.cBookDate).getTime()
                return dateB - dateA
            })
        }
        clean(removeAccounts)
        load(stores)
        stocksStore.add({
            cID: 0,
            cISIN: 'XX0000000000',
            cSymbol: 'XXXOO0',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: activeAccountId.value,
            cAskDates: CONS.DATE.DEFAULT_ISO
        }, true)
        //bookingTypesStore.add({cID: 0, cName: '', cAccountNumberID: activeAccountId.value}, true)
        //
        if (accountsStore.items.length === 0 && sessionStorage.getItem(CONS.DEFAULTS.SESSION_STORAGE.HIDE_IMPORT_ALERT) === null) {
            info(messages.INFO_TITLE, messages.RESTRICTED_IMPORT, null)
            sessionStorage.setItem(CONS.DEFAULTS.SESSION_STORAGE.HIDE_IMPORT_ALERT, 'true')
        }
    }

    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        init,
        clean
    }
})

log('--- STORES records.ts ---')
