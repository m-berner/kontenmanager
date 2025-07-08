/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { defineStore } from 'pinia'
import { useAppApi } from '@/pages/background'
import { useSettingsStore } from '@/stores/settings'

interface IRecordsStore {
  accounts: IAccount[]
  bookings: IBooking[]
  bookingTypes: IBookingType[]
  stocks: IStock[]
  bookingSum: number
  bookingSumField: string
}

const { log } = useAppApi()

export const useRecordsStore = defineStore('records', {
  state: (): IRecordsStore => ({
    accounts: [],
    bookings: [],
    bookingSum: 0,
    bookingSumField: '',
    bookingTypes: [],
    stocks: []
  }),

  getters: {
    // You can add getters here if needed
    getAccountById: (state) => (id: number): IAccount | undefined => {
      return state.accounts.find(account => account.cID === id)
    },

    getBookingsByAccountId: (state) => (accountId: number): IBooking[] => {
      return state.bookings.filter(booking =>
        booking.cAccountNumberID === accountId
      )
    }
  },

  actions: {
    getAccountIndexById(ident: number): number {
      return this.accounts.findIndex((account: IAccount) => account.cID === ident)
    },

    getBookingTypeNameById(ident: number): string {
      const bookingType = this.bookingTypes.find((entry: IBookingType) => entry.cID === ident)
      return bookingType ? bookingType.cName : ''
    },

    getBookingTypeById(ident: number): number {
      return this.bookingTypes.findIndex((entry: IBookingType) => entry.cID === ident)
    },

    getBookingTextById(ident: number): string {
      const booking = this.bookings.find((entry: IBooking) => entry.cID === ident)
      if (booking) {
        return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`
      } else {
        throw new Error('getBookingTextById: No booking found for given ID')
      }
    },

    getBookingById(ident: number): number {
      return this.bookings.findIndex((entry: IBooking) => entry.cID === ident)
    },

    getStockById(ident: number): number {
      return this.stocks.findIndex((entry: IStock) => entry.cID === ident)
    },

    sumBookings(): void {
      const settings = useSettingsStore()
      const activeAccountIndex = this.getAccountIndexById(settings.activeAccountId)

      if (activeAccountIndex === -1) {
        this.bookingSum = 0
        return
      }

      // Filter bookings for the active account if needed
      const bookingsPerAccount = [...this.bookings]

      if (bookingsPerAccount.length > 0) {
        this.bookingSum = bookingsPerAccount
          .map((entry: IBooking) => {
            const fees = entry.cTax + entry.cSourceTax + entry.cTransactionTax + entry.cSoli + entry.cFee
            const balance = entry.cCredit - entry.cDebit
            return fees + balance
          })
          .reduce((acc: number, cur: number) => acc + cur, 0)
      } else {
        this.bookingSum = 0
      }
    },

    setBookingSumField(value: string): void {
      this.bookingSumField = value
    },

    initStore(stores: IStores): void {
      log('RECORDS: initStore')

      // Clear existing data
      this.accounts.length = 0
      this.bookings.length = 0
      this.bookingTypes.length = 0
      this.stocks.length = 0

      // Set new data
      this.accounts.push(...stores.accounts)
      this.bookings.push(...stores.bookings)
      this.bookingTypes.push(...stores.bookingTypes)
      this.stocks.push(...stores.stocks)

      // Sort bookings by date (newest first)
      this.bookings.sort((a: IBooking, b: IBooking) => {
        const dateA = new Date(a.cDate).getTime()
        const dateB = new Date(b.cDate).getTime()
        return dateB - dateA
      })
    },

    addAccount(account: IAccount): void {
      log('RECORDS: addAccount')
      this.accounts.push(account)
    },

    updateAccount(account: IAccount): void {
      log('RECORDS: updateAccount')
      const index = this.getAccountIndexById(account.cID)
      if (index !== -1) {
        this.accounts[index] = {...account}
      }
    },

    deleteAccount(ident: number): void {
      log('RECORDS: deleteAccount', { info: ident })
      const index = this.getAccountIndexById(ident)
      if (index !== -1) {
        this.accounts.splice(index, 1)
      }
    },

    addBooking(booking: IBooking): void {
      log('RECORDS: addBooking')
      this.bookings.unshift(booking)
    },

    deleteBooking(ident: number): void {
      log('RECORDS: deleteBooking', { info: ident })
      const index = this.getBookingById(ident)
      if (index !== -1) {
        this.bookings.splice(index, 1)
      }
    },

    addStock(stock: IStock): void {
      log('RECORDS: addStock')
      this.stocks.push(stock)
    },

    updateStock(stock: IStock): void {
      log('RECORDS: updateStock')
      const index = this.getStockById(stock.cID)
      if (index !== -1) {
        this.stocks[index] = {...stock}
      }
    },

    deleteStock(ident: number): void {
      log('RECORDS: deleteStock', { info: ident })
      const index = this.getStockById(ident)
      if (index !== -1) {
        this.stocks.splice(index, 1)
      }
    },

    addBookingType(bookingType: IBookingType): void {
      log('RECORDS: addBookingType')
      this.bookingTypes.push(bookingType)
    },

    deleteBookingType(ident: number): void {
      log('RECORDS: deleteBookingType', { info: ident })
      const index = this.getBookingTypeById(ident)
      if (index !== -1) {
        this.bookingTypes.splice(index, 1)
      }
    },

    cleanStore(): void {
      log('RECORDS: cleanStore')
      this.accounts.length = 0
      this.bookings.length = 0
      this.bookingTypes.length = 0
      this.stocks.length = 0
      this.bookingSum = 0
      this.bookingSumField = ''
    }
  }
})

log('--- STORE records.ts ---')