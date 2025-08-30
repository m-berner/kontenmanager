<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useRecordsStore} from '@/stores/records'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useApp} from '@/composables/useApp'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {type UnwrapRef, computed, defineExpose, reactive, toRaw} from 'vue'
import type {IAccount, IBooking, IBookingType, IStock, IStockStore, IStoresDB} from '@/types.d'

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
const {clearStores, importStores} = useIndexedDB()

let chosen_file: Blob = reactive(new Blob())
const onChange = computed(ev => {
  chosen_file = (ev as IEventTarget).target.files[0]
})

const onClickOk = async (): Promise<void> => {
  log('IMPORT_DATABASE: onClickOk', {info: chosen_file})
  const records = useRecordsStore()
  const onError = async (): Promise<void> => {
    await notice(['IMPORT_DATABASE: onError: FileReader'])
  }
  const onFileLoaded = async (): Promise<void> => {
    log('IMPORT_DATABASE: onFileLoaded')
    if (typeof fr.result === 'string') {
      const backupObject: IBackup = JSON.parse(fr.result)
      const accounts: IAccount[] = []
      const bookings: IBooking[] = []
      const bookingTypes: IBookingType[] = []
      const stocks: IStock[] = []
      let account: IAccount
      let booking: IBooking
      let bookingType: IBookingType
      let stock: IStock
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
        await clearStores()
        const account: IAccount = {
          cID: activeId,
          cSwift: 'KMKLPJJ9099',
          cNumber: 'XX13120300001064506999',
          cLogoUrl: CONS.URLS.NO_LOGO,
          cStockAccount: true
        }
        records.addAccount(account)
        bookingTypes.push({cID: 1, cName: 'Aktienkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 2, cName: 'Aktienverkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 3, cName: 'Dividende', cAccountNumberID: activeId})
        bookingTypes.push({cID: 4, cName: 'Einzahlung', cAccountNumberID: activeId})
        bookingTypes.push({cID: 5, cName: 'Auszahlung', cAccountNumberID: activeId})
        for (const entry of bookingTypes) {
          records.addBookingType(entry)
        }
        for (smStock of backupObject.stocks) {
          const stockClone: IStock = {} as IStock
          let stockCloneStore: IStockStore = {} as IStockStore
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
          records.addStock(stockCloneStore)
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
          records.addBooking(transferClone)
          bookings.push(transferClone)
        }
        records.bookings.sort((a: IBooking, b: IBooking) => {
          const A = new Date(a.cDate).getTime()
          const B = new Date(b.cDate).getTime()
          return B - A
        })
        settings.setActiveAccountId(activeId)
        records.sumBookings()
        const stores: IStoresDB = {
          accounts: toRaw(records.accounts),
          bookings,
          bookingTypes,
          stocks
        }
        await importStores(stores)
        await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, stores.accounts[0].cID)
      } else if (backupObject.sm.cDBVersion > CONS.DB.IMPORT_MIN_VERSION) {
        records.cleanStore()
        for (account of backupObject.accounts) {
          records.addAccount(account)
          accounts.push(account)
        }
        activeId = records.accounts[0].cID
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
            records.addStock(stockClone)
          }
        }
        for (bookingType of backupObject.bookingTypes) {
          if (bookingType.cAccountNumberID === activeId) {
            records.addBookingType(bookingType)
          }
          bookingTypes.push(bookingType)
        }
        for (booking of backupObject.bookings) {
          if (booking.cAccountNumberID === activeId) {
            records.addBooking(booking)
          }
          bookings.push(booking)
        }
        settings.setActiveAccountId(activeId)
        records.sumBookings()
        const stores: IStoresDB = {
          accounts,
          bookings,
          bookingTypes,
          stocks
        }
        await importStores(stores)
        await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, stores.accounts[0].cID)
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
      runtime.resetTeleport()
    }
  }
  const fr: FileReader = new FileReader()
  fr.addEventListener(CONS.EVENTS.LOAD, onFileLoaded, CONS.SYSTEM.ONCE)
  fr.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
  if (chosen_file.size > 0) {
    fr.readAsText(chosen_file, 'UTF-8')
  }
}
const title = t('dialogs.importDatabase.title')
defineExpose({onClickOk, title})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
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
