/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IAccountDB, IBooking, IBookingDB, IBookingTypeDB, IStockDB, IStockOnlyMemory, IStores} from '@/types'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useAccounts} from '@/stores/childs/accounts'
import {useBookings} from '@/stores/childs/bookings'
import {useBookingTypes} from '@/stores/childs/bookingTypes'
import {useStocks} from '@/stores/childs/stocks'
import {useSettingsStore} from '@/stores/settings'

const {log} = useApp()

export const useRecordsStore = defineStore('records', () => {
    const accountsStore = useAccounts()
    const bookingsStore = useBookings()
    const bookingTypesStore = useBookingTypes()
    const stocksStore = useStocks()

    function clean(all = true) {
        log('RECORDS: clean')
        if (all) {
            accountsStore.clean()
        }
        bookingsStore.clean()
        bookingTypesStore.clean()
        stocksStore.clean()
    }

    function load(stores: IStores) {
        log('RECORDS: load')
        const settings = useSettingsStore()
        for (const entry of stores.accounts) {
            accountsStore.add(entry)
        }
        accountsStore.add({cID: 0, cSwift: '', cIban: '', cLogoUrl: '', cWithDepot: false}, true)
        for (const entry of stores.bookings) {
            bookingsStore.add(entry)
        }
        for (const entry of stores.bookingTypes) {
            bookingTypesStore.add(entry)
        }
        bookingTypesStore.add({cID: 0, cName: '', cAccountNumberID: settings.activeAccountId}, true)
        for (const entry of stores.stocks) {
            stocksStore.add(entry)
        }
        stocksStore.add({
            cID: 0,
            cISIN: 'XX00000000000000000000',
            cWKN: 'AAAAAAA',
            cSymbol: 'WWW',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: settings.activeAccountId,
            mBuyValue: 0,
            mMax: 0,
            mMin: 0,
            mChange: 0,
            mEuroChange: 0,
            mPortfolio: 0,
            mValue: 0
        }, true)
        bookingsStore.items.sort((a: IBooking, b: IBooking) => {
            const dateA = new Date(a.cDate).getTime()
            const dateB = new Date(b.cDate).getTime()
            return dateB - dateA
        })
    }

    async function init(): Promise<void> {
        log('RECORDS: init')
        const {getAllAccounts} = useAccountsDB()
        const {getAllBookings} = useBookingsDB()
        const {getAllBookingTypes} = useBookingTypesDB()
        const {getAllStocks} = useStocksDB()
        const settings = useSettingsStore()

        const accounts: IAccountDB[] = await getAllAccounts()
        const bookings: IBookingDB[] = (await getAllBookings()).filter((booking: IBookingDB) => booking.cAccountNumberID === settings.activeAccountId)
        const bookingTypes: IBookingTypeDB[] = (await getAllBookingTypes()).filter((bookingType: IBookingTypeDB) => bookingType.cAccountNumberID === settings.activeAccountId)
        const stocks: IStockDB[] = (await getAllStocks()).filter((stock: IStockDB) => stock.cAccountNumberID === settings.activeAccountId)
        //
        const stocksOnlyMemory: IStockOnlyMemory = {
            mPortfolio: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0
        }
        const stores: IStores = {
            accounts,
            bookings,
            bookingTypes,
            stocks: stocks.map((stock) => {
                return {...stock, ...stocksOnlyMemory}
            })
        }
        if (settings.activeAccountId < 1 && accounts.length > 0) {
            settings.activeAccountId = accounts[0].cID
        }
        clean()
        load(stores)
    }

    return {
        accounts: accountsStore,
        bookings: bookingsStore,
        bookingTypes: bookingTypesStore,
        stocks: stocksStore,
        init,
        load,
        clean
    }
})

log('--- STORES records.ts ---')
