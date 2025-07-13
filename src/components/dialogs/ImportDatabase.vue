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
import type {Stockmanager} from '@/pages/background'
import {useAppApi} from '@/pages/background'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {type Reactive, reactive, toRaw, type UnwrapRef} from 'vue'

interface IEventTarget extends HTMLInputElement {
  target: { files: UnwrapRef<Blob>[] }
}

interface IState {
  _chosen_file: Blob
}

const {t} = useI18n()
const {CONS, log} = useAppApi()
const settings = useSettingsStore()

const state: Reactive<IState> = reactive({
  _chosen_file: new Blob()
})

const onClickOk = async (): Promise<void> => {
  log('IMPORT_DATABASE: onClickOk', {info: state._chosen_file})
  const {notice, toISODate} = useAppApi()
  const records = useRecordsStore()
  const runtime = useRuntimeStore()
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
      let smStock: Stockmanager.IStock
      let activeId = 1
      const getCreditDebit = (rec: Stockmanager.ITransfer): number => {
        let result: number
        switch (rec.cType) {
          case 1:
            result = rec.cUnitQuotation * rec.cCount
            break
          case 2:
            result = rec.cUnitQuotation * -rec.cCount
            break
          case 3:
            result = rec.cUnitQuotation * rec.cCount
            break
          case 4:
            result = rec.cAmount
            break
          case 5:
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
        await browser.runtime.sendMessage(JSON.stringify({
          type: CONS.MESSAGES.DB__DELETE_ALL
        }))
        const account: IAccount = {
          cID: 1,
          cSwift: 'KMKLPJJ9099',
          cNumber: 'XX13120300001064506999',
          cLogoUrl: '',
          cLogoSearchName: '',
          cStockAccount: true
        }
        records.addAccount(account)
        bookingTypes.push({cID: 1, cName: 'Aktienkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 2, cName: 'Aktienverkauf', cAccountNumberID: activeId})
        bookingTypes.push({cID: 3, cName: 'Dividende', cAccountNumberID: activeId})
        bookingTypes.push({cID: 4, cName: 'Einzahlung', cAccountNumberID: activeId})
        bookingTypes.push({cID: 5, cName: 'Auszahlung', cAccountNumberID: activeId})
        for (let entry of bookingTypes) {
          records.addBookingType(entry)
        }
        for (smStock of backupObject.stocks) {
          let stockClone: IStock = {} as IStock
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
          let transferClone: IBooking = {} as IBooking
          let smTransfer: Stockmanager.ITransfer = backupObject.transfers[i]
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
        runtime.setLogo()
        records.sumBookings()
        const stores: IStoresDB = {
          accounts: toRaw(records.accounts),
          bookings: bookings,
          bookingTypes: bookingTypes,
          stocks: stocks
        }
        await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__ADD_STORES, data: stores}))
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
            let stockClone = {
              ...stock, mPortfolio: 0,
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
        for (bookingType of backupObject.booking_types) {
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
        runtime.setLogo()
        records.sumBookings()

        const stores: IStoresDB = {
          accounts: accounts,
          bookings: bookings,
          bookingTypes: bookingTypes,
          stocks: stocks
        }
        await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__ADD_STORES, data: stores}))
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
    }
  }
  const fr: FileReader = new FileReader()
  fr.addEventListener(CONS.EVENTS.LOAD, onFileLoaded, CONS.SYSTEM.ONCE)
  fr.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
  if (state._chosen_file.size > 0) {
    fr.readAsText(state._chosen_file, 'UTF-8')
  }
}
const title = t('dialogs.importDatabase.title')

defineExpose({onClickOk, title})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
        v-bind:label="t('dialogs.importDatabase.messageDelete')"
        variant="plain"
      ></v-text-field>
      <v-file-input
        accept=".json"
        v-bind:clearable="true"
        v-bind:label="t('dialogs.importDatabase.label')"
        variant="outlined"
        v-on:change="(ev: IEventTarget) => { state._chosen_file = ev.target.files[0] }"></v-file-input>
    </v-card-text>
  </v-form>
</template>
