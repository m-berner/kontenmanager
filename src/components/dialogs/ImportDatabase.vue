<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount, IBooking, IBookingType, IRecordsDB, IStock} from '@/types.d'
import type {UnwrapRef} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
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
const {CONS, log, toISODate} = useApp()
const {notice, setStorage} = useBrowser()
const {clearAllAccounts, importAccounts} = useAccountsDB()
const {clearAllBookings, importBookings} = useBookingsDB()
const {clearAllBookingTypes, importBookingTypes} = useBookingTypesDB()
const {clearAllStocks, importStocks} = useStocksDB()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const fileBlob = ref<Blob>(new Blob())
const onChange = (ev: IEventTarget) => {
  fileBlob.value = ev.target.files[0]
}

const onClickOk = async (): Promise<void> => {
  log('IMPORT_DATABASE: onClickOk')
  const records = useRecordsStore()

  const onReaderError = async (): Promise<void> => {
    await notice(['IMPORT_DATABASE: onError: FileReader'])
  }
  const onReaderLoaded = async (): Promise<void> => {
    log('IMPORT_DATABASE: onFileLoaded')
    if (typeof fr.result === 'string') {
      const backupObject: IBackup = JSON.parse(fr.result)
      const accounts: IAccount[] = []
      const accountsDB: IRecordsDB[] = []
      const bookings: IBooking[] = []
      const bookingsDB: IRecordsDB[] = []
      const bookingTypes: IBookingType[] = []
      const bookingTypesDB: IRecordsDB[] = []
      const stocks: IStock[] = []
      const stocksDB: IRecordsDB[] = []
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
      records.clean()
      await clearAllAccounts()
      await clearAllBookings()
      await clearAllBookingTypes()
      await clearAllStocks()
      if (!Object.keys(backupObject.sm).includes('cDBVersion')) {
        await notice(['IMPORT_DATABASE: onFileLoaded', 'Could not read backup file'])
      } else if (backupObject.sm.cDBVersion < CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        await notice([t('dialogs.importDatabase.messageVersion', {version: CONS.INDEXED_DB.IMPORT_MIN_VERSION.toString()})])
      } else if (backupObject.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        const accountRecords = [{
          cID: activeId,
          cSwift: 'KMKLPJJ9099',
          cNumber: 'XX13120300001064506999',
          cLogoUrl: '', // TODO cUrl
          cWithDepot: true // TODO withDepot
        }]
        const bookingTypeRecords = [
          {cID: 1, cName: 'Aktienkauf', cAccountNumberID: activeId},
          {cID: 2, cName: 'Aktienverkauf', cAccountNumberID: activeId},
          {cID: 3, cName: 'Dividende', cAccountNumberID: activeId},
          {cID: 4, cName: 'Einzahlung', cAccountNumberID: activeId},
          {cID: 5, cName: 'Auszahlung', cAccountNumberID: activeId}
        ]
        for (const rec of accountRecords) {
          accounts.push(rec)
          accountsDB.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of bookingTypeRecords) {
          bookingTypes.push(rec)
          bookingTypesDB.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of backupObject.stocks) {
          const stockClone: IStock = {} as IStock
          let stockCloneStore: IStock = {} as IStock
          stockClone.cID = rec.cID
          stockClone.cAccountNumberID = activeId
          stockClone.cSymbol = rec.cSym
          stockClone.cMeetingDay = toISODate(rec.cMeetingDay)
          stockClone.cQuarterDay = toISODate(rec.cQuarterDay)
          stockClone.cCompany = rec.cCompany
          stockClone.cISIN = rec.cISIN
          stockClone.cWKN = rec.cWKN
          stockClone.cFadeOut = rec.cFadeOut
          stockClone.cFirstPage = rec.cFirstPage
          stockClone.cFirstPage = rec.cFirstPage
          stockClone.cURL = rec.cURL
          stocksDB.push({type: 'add', data: stockClone, key: -1})
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
          stocks.push(stockCloneStore)
        }
        for (let i = 0; backupObject.transfers && i < backupObject.transfers.length; i++) {
          const booking: IBooking = {} as IBooking
          const smTransfer: StockManager.ITransfer = backupObject.transfers[i]
          booking.cID = i + 1
          booking.cAccountNumberID = activeId
          booking.cStockID = smTransfer.cStockID
          booking.cDate = toISODate(smTransfer.cDate)
          booking.cBookingTypeID = smTransfer.cType
          booking.cExDate = toISODate(smTransfer.cExDay)
          booking.cCount = smTransfer.cCount < 0 ? -smTransfer.cCount : smTransfer.cCount
          booking.cDescription = smTransfer.cDescription
          booking.cTransactionTax = smTransfer.cFTax
          booking.cSourceTax = smTransfer.cSTax
          booking.cFee = smTransfer.cFees
          booking.cTax = smTransfer.cTax
          booking.cMarketPlace = smTransfer.cMarketPlace
          booking.cSoli = smTransfer.cSoli
          booking.cDebit = smTransfer.cType === 1 || smTransfer.cType === 5 ? getCreditDebit(smTransfer) : 0
          booking.cCredit = smTransfer.cType === 2 || smTransfer.cType === 3 || smTransfer.cType === 4 ? getCreditDebit(smTransfer) : 0
          bookings.push(booking)
          //await addBooking(transferClone)
        }
      } else if (backupObject.sm.cDBVersion > CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        for (const rec of backupObject.accounts) {
          accounts.push(rec)
          accountsDB.push({type: 'add', data: rec, key: -1})
        }
        activeId = accounts[0].cID
        for (const rec of backupObject.stocks) {
          stocksDB.push({type: 'add', data: rec, key: -1})
          if (rec.cAccountNumberID === activeId) {
            const stockClone = {
              ...rec,
              mPortfolio: 0,
              mChange: 0,
              mEuroChange: 0,
              mBuyValue: 0,
              mMin: 0,
              mValue: 0,
              mMax: 0
            }
            stocks.push(stockClone)
          }
        }
        for (const rec of backupObject.bookingTypes) {
          bookingTypesDB.push({type: 'add', data: rec, key: -1})
          if (rec.cAccountNumberID === activeId) {
            bookingTypes.push(rec)
          }
        }
        for (const rec of backupObject.bookings) {
          bookingsDB.push({type: 'add', data: rec, key: -1})
          if (rec.cAccountNumberID === activeId) {
            bookings.push(rec)
          }
        }
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
      settings.activeAccountId = activeId
      records.load({accounts, bookingTypes, bookings, stocks})
      // records.bookings.items.sort((a: IBooking, b: IBooking) => {
      //   const A = new Date(a.cDate).getTime()
      //   const B = new Date(b.cDate).getTime()
      //   return B - A
      // })
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeId)
      await importAccounts(accountsDB)
      await importBookingTypes(bookingTypesDB)
      await importBookings(bookingsDB)
      await importStocks(stocksDB)
      runtime.resetTeleport()
    }
  }

  const fr: FileReader = new FileReader()
  fr.addEventListener(CONS.EVENTS.LOAD, onReaderLoaded, CONS.SYSTEM.ONCE)
  fr.addEventListener(CONS.EVENTS.ERROR, onReaderError, CONS.SYSTEM.ONCE)
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
