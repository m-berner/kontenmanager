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
  accounts: IAccount[]
  bookings: IBooking[]
  bookingTypes: IBookingType[]
  stocks: IStock[]
  bookingSum: number
  bookingSumField: string
}

interface IRecordsGetter {
  //
}

interface IRecordsActions {
  getAccountIndexById: (ident: number) => number
  getBookingTypeNameById: (ident: number) => string
  getBookingTypeById: (ident: number) => number
  getBookingTextById: (ident: number) => string | Error
  getBookingById: (ident: number) => number
  getStockById: (ident: number) => number
  sumBookings: () => void
  setBookingSumField: (value: string) => void
  initStore: (stores: IStores) => void
  addAccount: (account: IAccount) => void
  updateAccount: (account: IAccount) => void
  deleteAccount: (ident: number) => void
  addBooking: (booking: IBooking) => void
  deleteBooking: (ident: number) => void
  addStock: (stock: IStock) => void
  updateStock: (stock: IStock) => void
  deleteStock: (ident: number) => void
  addBookingType: (value: IBookingType) => void
  deleteBookingType: (ident: number) => void
  cleanStore: () => void
}

const {log} = useAppApi()

export const useRecordsStore: StoreDefinition<'records', IRecordsStore, IRecordsGetter, IRecordsActions> = defineStore('records', {
  state: (): IRecordsStore => {
    return {
      accounts: [],
      bookings: [],
      bookingSum: 0,
      bookingSumField: '',
      bookingTypes: [],
      stocks: []
    }
  },
  getters: {
    // accounts(state: IRecordsStore): IAccount[] {
    //   return state.accounts
    // },
    // bookings(state: IRecordsStore): IBooking[] {
    //   return state.bookings
    // },
    // stocks(state: IRecordsStore): IStock[] {
    //   return state.stocks
    // },
    // bookingSum(state: IRecordsStore): number {
    //   return state._booking_sum
    // },
    // bookingSumField(state: IRecordsStore): string {
    //   return state._booking_sum_field
    // },
    // bookingTypes(state: IRecordsStore): IBookingType[] {
    //   return state.bookingTypes
    // }
  },
  actions: {
    getAccountIndexById(ident) {
      return this.accounts.findIndex((account: IAccount) => {
        return account.cID === ident
      })
    },
    getBookingTypeNameById(ident) {
      const tmp = this.bookingTypes.filter((entry: IBookingType) => {
        return entry.cID === ident
      })
      if (tmp.length > 0) {
        return tmp[0].cName
      } else {
        return ''
      }
    },
    getBookingTypeById(ident) {
      return this.bookingTypes.findIndex((entry: IBookingType) => {
        return entry.cID === ident
      })
    },
    getBookingTextById(ident) {
      const tmp = this.bookings.filter((entry: IBooking) => {
        return entry.cID === ident
      })
      if (tmp.length > 0) {
        return `${tmp[0].cDate} : ${tmp[0].cDebit} : ${tmp[0].cCredit}`
      } else {
        throw new Error('getBookingTextById: No booking found for given ID')
      }
    },
    getBookingById(ident) {
      return this.bookings.findIndex((entry: IBooking) => {
        return entry.cID === ident
      })
    },
    getStockById(ident) {
      return this.stocks.findIndex((entry: IStock) => {
        return entry.cID === ident
      })
    },
    sumBookings() {
      const settings = useSettingsStore()
      const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId)
      if (activeAccountIndex === -1) {
        return
      }
      // const bookings_per_account = this.bookings.filter((rec: IBooking) => {
      //   return rec.cAccountNumberID === this.accounts[activeAccountIndex].cID
      // })
      const bookings_per_account = [...this.bookings]
      if (bookings_per_account.length > 0) {
        // bookings_per_account.sort((a: IBooking, b: IBooking) => {
        //   const A = new Date(a.cDate).getTime()
        //   const B = new Date(b.cDate).getTime()
        //   return A - B
        // })
        //this.bookings = bookings_per_account
        this.bookingSum = bookings_per_account.map((entry: IBooking) => {
          return entry.cCredit - entry.cDebit
        }).reduce((acc: number, cur: number) => {
          return acc + cur
        }, 0)
      } else {
        this.bookings = []
        this.bookingSum = 0
      }
    },
    setBookingSumField(value) {
      this.bookingSumField = value
    },
    initStore(stores) {
      log('RECORDS: initStore')
      this.bookings.splice(0, this.bookings.length)
      this.bookingTypes.splice(0, this.bookingTypes.length)
      this.accounts.splice(0, this.accounts.length)
      this.stocks.splice(0, this.stocks.length)
      this.accounts = stores.accounts
      this.bookings = stores.bookings
      this.bookingTypes = stores.bookingTypes
      this.stocks = stores.stocks
      this.bookings.sort((a: IBooking, b: IBooking) => {
        const A = new Date(a.cDate).getTime()
        const B = new Date(b.cDate).getTime()
        return B - A
      })
    },
    addAccount(value) {
      log('RECORDS: addAccount')
      this.accounts.push(value)
    },
    updateAccount(value) {
      log('RECORDS: updateAccount')
      const cloneAccounts = [...this.accounts]
      this.accounts = cloneAccounts.map(account => {
        if (account.cID === value.cID) {
          return value
        } else {
          return toRaw(account)
        }
      })
    },
    deleteAccount(ident) {
      log('RECORDS: deleteAccount', {info: ident})
      this.accounts.splice(this.getAccountIndexById(ident), 1)
    },
    addBooking(value) {
      log('RECORDS: addBooking')
      this.bookings.unshift(value)
    },
    deleteBooking(ident) {
      log('RECORDS: deleteBooking', {info: ident})
      this.bookings.splice(this.getBookingById(ident), 1)
    },
    addStock(value) {
      log('RECORDS: addStock')
      this.stocks.push(value)
    },
    deleteStock(ident) {
      log('RECORDS: deleteStock', {info: ident})
      this.stocks.splice(this.getStockById(ident), 1)
    },
    updateStock(value) {
      log('RECORDS: updateStock')
      const cloneStocks = [...this.stocks]
      this.stocks = cloneStocks.map(stock => {
        if (stock.cID === value.cID) {
          return value
        } else {
          return toRaw(stock)
        }
      })
    },
    addBookingType(value) {
      log('RECORDS: addBookingType')
      this.bookingTypes.push(value)
    },
    deleteBookingType(ident) {
      log('RECORDS: deleteBookingType', {info: ident})
      this.bookingTypes.splice(this.getBookingTypeById(ident), 1)
    },
    cleanStore() {
      log('RECORDS: cleanStore')
      this.bookings.splice(0, this.bookings.length)
      this.bookingTypes.splice(0, this.bookingTypes.length)
      this.accounts.splice(0, this.accounts.length)
      this.stocks.splice(0, this.stocks.length)
    }
  }
})

log('--- STORE records.js ---')
