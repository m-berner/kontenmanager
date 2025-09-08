<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {
  IAccount,
  IAccountDB,
  IBooking,
  IBookingDB,
  IBookingType,
  IBookingTypeDB,
  IStock,
  IStockDB,
  IStoresDB
} from '@/types.d'
import type {UnwrapRef} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useApp} from '@/composables/useApp'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useIndexedDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'

namespace StockManager {
  export interface IStock {
    cID: number
    cCompany: string
    cISIN: string
    cWKN: string
    cSym: string
    cMeetingDay: number
    cQuarterDay: number
    cFadeOut: number
    cFirstPage: number
    cURL: string
  }

  export interface ITransfer {
    cID: number
    cStockID: number
    cDate: number
    cExDay: number
    cUnitQuotation: number
    cAmount: number
    cCount: number
    cFees: number
    cSTax: number
    cFTax: number
    cTax: number
    cSoli: number
    cMarketPlace: string
    cDescription: string
    cType: number
  }
}

interface IBackup {
  sm: {
    cVersion: number
    cDBVersion: number
    cEngine: string
  }
  accounts: IAccount[]
  bookings: IBooking[]
  bookingTypes: IBookingType[]
  stocks: IStock[] & StockManager.IStock[]
  transfers?: IBooking[] & StockManager.ITransfer[]
}

interface IEventTarget extends HTMLInputElement {
  target: { files: UnwrapRef<Blob>[] }
}

const {t} = useI18n()
const {CONS} = useConstant()
const {toISODate} = useApp()
const {log, notice} = useNotification()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {setStorage} = useBrowser()
const {getDB} = useIndexedDB()
const {clearAllAccounts} = useAccountsDB()
const {clearAllBookings} = useBookingsDB()
const {clearAllBookingTypes} = useBookingTypesDB()
const {clearAllStocks} = useStocksDB()

const fileBlob = ref<Blob>(new Blob())

const onChange = (ev: IEventTarget) => {
  fileBlob.value = ev.target.files[0]
}

const onClickOk = async (): Promise<void> => {
  log('IMPORT_DATABASE: onClickOk')
  const records = useRecordsStore()

  const importStores = async (stores: IStoresDB, all = true) => {
    log('USE_INDEXED_DB: importStores')
    const db = await getDB()
    return new Promise(async (resolve, reject) => {
      if (db != null) {
        const onComplete = async (): Promise<void> => {
          await notice(['All memory records are added to the database!'])
          resolve('USE_INDEXED_DB: importStores: all memory records are added to the database!')
        }
        const onAbort = (): void => {
          reject(requestTransaction.error)
        }
        const onError = (ev: Event): void => {
          reject(ev)
        }
        const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite')
        requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
        requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE)
        requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
        const onSuccessClearBookings = (): void => {
          log('USE_INDEXED_DB: bookings dropped')
          for (let i = 0; i < stores.bookingsDB.length; i++) {
            requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add({...stores.bookingsDB[i]})
          }
        }
        const onSuccessClearAccounts = (): void => {
          log('USE_INDEXED_DB: accounts dropped')
          for (let i = 0; i < stores.accountsDB.length; i++) {
            requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add({...stores.accountsDB[i]})
          }
        }
        const onSuccessClearBookingTypes = (): void => {
          log('USE_INDEXED_DB: booking types dropped')
          for (let i = 0; i < stores.bookingTypesDB.length; i++) {
            requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add({...stores.bookingTypesDB[i]})
          }
        }
        const onSuccessClearStocks = (): void => {
          log('USE_INDEXED_DB: stocks dropped')
          for (let i = 0; i < stores.stocksDB.length; i++) {
            requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add({...stores.stocksDB[i]})
          }
        }
        const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear()
        requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE)
        if (all) {
          const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
          requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
        }
        const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
        requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
        const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
        requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
      }
    })
  }
  const onReaderError = async (): Promise<void> => {
    await notice(['IMPORT_DATABASE: onError: FileReader'])
  }
  const onReaderLoaded = async (): Promise<void> => {
    log('IMPORT_DATABASE: onFileLoaded')
    if (typeof fr.result === 'string') {
      const backupObject: IBackup = JSON.parse(fr.result)
      const accounts: IAccountDB[] = []
      const bookings: IBookingDB[] = []
      const bookingTypes: IBookingTypeDB[] = []
      const stocks: IStockDB[] = []
      let account: IAccountDB
      let booking: IBookingDB
      let bookingType: IBookingTypeDB
      let stock: IStockDB
      let smStock: StockManager.IStock
      let activeId = 1
      const getCreditDebit = (rec: StockManager.ITransfer): number => {
        let result: number
        switch (rec.cType) {
          case 1:
            // Buy
            result = rec.cUnitQuotation * rec.cCount
            break
          case 2:
            // Sell
            result = rec.cUnitQuotation * -rec.cCount
            break
          case 3:
            // Dividend
            result = rec.cUnitQuotation * rec.cCount
            break
          case 4:
            // Credit
            result = rec.cAmount
            break
          case 5:
            // Debit
            result = -rec.cAmount
            break
          default:
            result = 0
        }
        return result
      }
      if (!Object.keys(backupObject.sm).includes('cDBVersion')) {
        await notice(['IMPORT_DATABASE: onFileLoaded', 'Could not read backup file'])
      } else if (backupObject.sm.cDBVersion < CONS.DB.IMPORT_MIN_VERSION) {
        await notice([t('dialogs.importDatabase.messageVersion', {version: CONS.DB.IMPORT_MIN_VERSION.toString()})])
      } else if (backupObject.sm.cDBVersion === CONS.DB.IMPORT_MIN_VERSION) {
        records.cleanStore()
        await clearAllAccounts()
        await clearAllBookings()
        await clearAllBookingTypes()
        await clearAllStocks()
        const account: IAccount = {
          cID: activeId,
          cSwift: 'KMKLPJJ9099',
          cNumber: 'XX13120300001064506999',
          cLogoUrl: '', // TOOD cUrl
          cStockAccount: true // TODO withDepot
        }
        records.accounts.addAccount(account)

        bookingTypes.push({cID: 1, cName: 'Aktienkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 2, cName: 'Aktienverkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 3, cName: 'Dividende', cAccountNumberID: activeId})
        bookingTypes.push({cID: 4, cName: 'Einzahlung', cAccountNumberID: activeId})
        bookingTypes.push({cID: 5, cName: 'Auszahlung', cAccountNumberID: activeId})
        for (const entry of bookingTypes) {
          records.bookingTypes.addBookingType(entry)
        }

        for (smStock of backupObject.stocks) {
          const stockClone: IStock = {} as IStock
          let stockCloneStore: IStock = {} as IStock
          stockClone.cID = smStock.cID
          stockClone.cAccountNumberID = activeId
          stockClone.cSymbol = smStock.cSym
          stockClone.cMeetingDay = toISODate(smStock.cMeetingDay)
          stockClone.cQuarterDay = toISODate(smStock.cQuarterDay)
          stockClone.cCompany = smStock.cCompany
          stockClone.cISIN = smStock.cISIN
          stockClone.cWKN = smStock.cWKN
          stockClone.cFadeOut = smStock.cFadeOut
          stockClone.cFirstPage = smStock.cFirstPage
          stockClone.cFirstPage = smStock.cFirstPage
          stockClone.cURL = smStock.cURL
          stocks.push({...stockClone})
          stockCloneStore = {
            ...stockClone,
            mPortfolio: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0
          }
          records.stocks.addStock(stockCloneStore)
        }
        for (let i = 0; backupObject.transfers && i < backupObject.transfers.length; i++) {
          const transferClone: IBooking = {} as IBooking
          const smTransfer: StockManager.ITransfer = backupObject.transfers[i]
          transferClone.cID = i + 1
          transferClone.cAccountNumberID = activeId
          transferClone.cStockID = smTransfer.cStockID
          transferClone.cDate = toISODate(smTransfer.cDate)
          transferClone.cBookingTypeID = smTransfer.cType
          transferClone.cExDate = toISODate(smTransfer.cExDay)
          transferClone.cCount = smTransfer.cCount < 0 ? -smTransfer.cCount : smTransfer.cCount
          transferClone.cDescription = smTransfer.cDescription
          transferClone.cTransactionTax = smTransfer.cFTax
          transferClone.cSourceTax = smTransfer.cSTax
          transferClone.cFee = smTransfer.cFees
          transferClone.cTax = smTransfer.cTax
          transferClone.cMarketPlace = smTransfer.cMarketPlace
          transferClone.cSoli = smTransfer.cSoli
          transferClone.cDebit = smTransfer.cType === 1 || smTransfer.cType === 5 ? getCreditDebit(smTransfer) : 0
          transferClone.cCredit = smTransfer.cType === 2 || smTransfer.cType === 3 || smTransfer.cType === 4 ? getCreditDebit(smTransfer) : 0
          records.bookings.addBooking(transferClone)
          bookings.push(transferClone)
        }
        records.bookings.items.sort((a: IBooking, b: IBooking) => {
          const A = new Date(a.cDate).getTime()
          const B = new Date(b.cDate).getTime()
          return B - A
        })
        settings.activeAccountId = (activeId)
        records.bookings.sumBookings()
        const stores: IStoresDB = {
          accountsDB: accounts,
          bookingsDB: bookings,
          bookingTypesDB: bookingTypes,
          stocksDB: stocks
        }
        await importStores(stores)
        await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, stores.accountsDB[0].cID)
      } else if (backupObject.sm.cDBVersion > CONS.DB.IMPORT_MIN_VERSION) {
        records.cleanStore()
        for (account of backupObject.accounts) {
          records.accounts.addAccount(account)
          accounts.push(account)
        }
        activeId = records.accounts.items[0].cID
        for (stock of backupObject.stocks) {
          stocks.push(stock)
          if (stock.cAccountNumberID === activeId) {
            const stockClone = {
              ...stock,
              mPortfolio: 0,
              mChange: 0,
              mEuroChange: 0,
              mBuyValue: 0,
              mMin: 0,
              mValue: 0,
              mMax: 0
            }
            records.stocks.addStock(stockClone)
          }
        }
        for (bookingType of backupObject.bookingTypes) {
          if (bookingType.cAccountNumberID === activeId) {
            records.bookingTypes.addBookingType(bookingType)
          }
          bookingTypes.push(bookingType)
        }
        for (booking of backupObject.bookings) {
          if (booking.cAccountNumberID === activeId) {
            records.bookings.addBooking(booking)
          }
          bookings.push(booking)
        }
        settings.activeAccountId = (activeId)
        records.bookings.sumBookings()
        const stores: IStoresDB = {
          accountsDB: accounts,
          bookingsDB: bookings,
          bookingTypesDB: bookingTypes,
          stocksDB: stocks
        }
        await importStores(stores)
        await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, stores.accountsDB[0].cID)
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
      runtime.resetTeleport()
    }
  }

  const fr: FileReader = new FileReader()
  fr.addEventListener(CONS.EVENTS.LOAD, onReaderLoaded, CONS.SYSTEM.ONCE)
  fr.addEventListener(CONS.EVENTS.ERR, onReaderError, CONS.SYSTEM.ONCE)
  if (fileBlob.value.size > 0) {
    fr.readAsText(fileBlob.value, 'UTF-8')
  }
}

const title = t('dialogs.importDatabase.title')

defineExpose({onClickOk, title})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          :label="t('dialogs.importDatabase.messageDelete')"
          variant="plain"
      />
      <v-file-input
          :clearable="true"
          :label="t('dialogs.importDatabase.label')"
          accept=".json"
          variant="outlined"
          @change="onChange"/>
    </v-card-text>
  </v-form>
</template>
