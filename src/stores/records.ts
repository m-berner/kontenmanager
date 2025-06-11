/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore, type StoreDefinition} from 'pinia'
import {useAppApi} from '@/pages/background'
import {useSettingsStore} from '@/stores/settings'
import {toRaw} from 'vue'

interface IRecordsStore {
  _accounts: IAccount[]
  _bookings: IBooking[]
  _booking_types: IBookingType[]
  _stocks: IStock[]
  _booking_sum: number
  _booking_sum_field: string
}

const {log} = useAppApi()

export const useRecordsStore: StoreDefinition<'records', IRecordsStore> = defineStore('records', {
  state: (): IRecordsStore => {
    return {
      _accounts: [],
      _bookings: [],
      _booking_sum: 0,
      _booking_sum_field: '',
      _booking_types: [],
      _stocks: []
    }
  },
  getters: {
    accounts(state: IRecordsStore): IAccount[] {
      return state._accounts
    },
    bookings(state: IRecordsStore): IBooking[] {
      return state._bookings
    },
    stocks(state: IRecordsStore): IStock[] {
      return state._stocks
    },
    bookingSum(state: IRecordsStore): number {
      return state._booking_sum
    },
    bookingSumField(state: IRecordsStore): string {
      return state._booking_sum_field
    },
    bookingTypes(state: IRecordsStore): IBookingType[] {
      return state._booking_types
    }
  },
  actions: {
    getAccountIndexById(ident: number): number {
      return this._accounts.findIndex((account: IAccount) => {
        return account.cID === ident
      })
    },
    getBookingTypeNameById(ident: number): string {
      const tmp = this._booking_types.filter((entry: IBookingType) => {
        return entry.cID === ident
      })
      if (tmp.length > 0) {
        return tmp[0].cName
      } else {
        return ''
      }
    },
    getBookingTypeById(ident: number): number {
      return this._booking_types.findIndex((entry: IBookingType) => {
        return entry.cID === ident
      })
    },
    getBookingTextById(ident: number): string | Error {
      const tmp = this._bookings.filter((entry: IBooking) => {
        return entry.cID === ident
      })
      if (tmp.length > 0) {
        return `${tmp[0].cDate} : ${tmp[0].cDebit} : ${tmp[0].cCredit}`
      } else {
        throw new Error('getBookingTextById: No booking found for given ID')
      }
    },
    getBookingById(ident: number): number {
      return this._bookings.findIndex((entry: IBooking) => {
        return entry.cID === ident
      })
    },
    getStockById(ident: number): number {
      return this._stocks.findIndex((entry: IStock) => {
        return entry.cID === ident
      })
    },
    sumBookings(): void {
      const settings = useSettingsStore()
      const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId)
      if (activeAccountIndex === -1) {
        return
      }
      // const bookings_per_account = this._bookings.filter((rec: IBooking) => {
      //   return rec.cAccountNumberID === this._accounts[activeAccountIndex].cID
      // })
      const bookings_per_account = [...this._bookings]
      if (bookings_per_account.length > 0) {
        // bookings_per_account.sort((a: IBooking, b: IBooking) => {
        //   const A = new Date(a.cDate).getTime()
        //   const B = new Date(b.cDate).getTime()
        //   return A - B
        // })
        //this._bookings = bookings_per_account
        this._booking_sum = bookings_per_account.map((entry: IBooking) => {
          return entry.cCredit - entry.cDebit
        }).reduce((acc: number, cur: number) => {
          return acc + cur
        }, 0)
      } else {
        this._bookings = []
        this._booking_sum = 0
      }
    },
    setBookingSumField(value: string): void {
      this._booking_sum_field = value
    },
    initStore(stores): void {
      log('RECORDS: initStore')
      this._bookings.splice(0, this._bookings.length)
      this._booking_types.splice(0, this._booking_types.length)
      this._accounts.splice(0, this._accounts.length)
      this._stocks.splice(0, this._stocks.length)
      this._accounts = stores.accounts
      this._bookings = stores.bookings
      this._booking_types = stores.bookingTypes
      this._stocks = stores.stocks
      this._bookings.sort((a: IBooking, b: IBooking) => {
        const A = new Date(a.cDate).getTime()
        const B = new Date(b.cDate).getTime()
        return B - A
      })
    },
    addAccount(value: IAccount): void {
      log('RECORDS: addAccount')
      this._accounts.push(value)
    },
    updateAccount(value: IAccount): void {
      log('RECORDS: updateAccount')
      const cloneAccounts = [...this._accounts]
      this._accounts = cloneAccounts.map(account => {
        if (account.cID === value.cID) {
          return value
        } else {
          return toRaw(account)
        }
      })
    },
    addBooking(value: IBooking): void {
      log('RECORDS: addBooking')
      this._bookings.unshift(value)
    },
    deleteBooking(ident: number): void {
      log('RECORDS: deleteBooking', {info: ident})
      this._bookings.splice(this.getBookingById(ident), 1)
    },
    addStock(value: IStock): void {
      log('RECORDS: addStock')
      this._stocks.push(value)
    },
    deleteStock(ident: number): void {
      log('RECORDS: deleteStock', {info: ident})
      this._stocks.splice(this.getStockById(ident), 1)
    },
    updateStock(value: IStock): void {
      log('RECORDS: updateStock')
      const cloneStocks = [...this._stocks]
      this._stocks = cloneStocks.map(stock => {
        if (stock.cID === value.cID) {
          return value
        } else {
          return toRaw(stock)
        }
      })
    },
    addBookingType(value: IBookingType): void {
      log('RECORDS: addBookingType')
      this._booking_types.push(value)
    },
    deleteBookingType(ident: number): void {
      log('RECORDS: deleteBookingType', {info: ident})
      this._booking_types.splice(this.getBookingTypeById(ident), 1)
    },
    cleanStore(): void {
      log('RECORDS: cleanStore')
      this._bookings.splice(0, this._bookings.length)
      this._booking_types.splice(0, this._booking_types.length)
      this._accounts.splice(0, this._accounts.length)
      this._stocks.splice(0, this._stocks.length)
    }
  }
})

log('--- STORE records.js ---')
