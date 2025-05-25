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
import {useAppApi} from '@/pages/background'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {reactive, toRaw} from 'vue'
import {appMessagePort} from '@/pages/app'

interface IEventTarget extends HTMLInputElement {
  target: { files: File[] }
}

const {t} = useI18n()
const {CONS, log, toISODate} = useAppApi()
const settings = useSettingsStore()

const state = reactive({
  _choosen_file: new Blob()
})

const ok = async (): Promise<void> => {
  log('IMPORTDATABASE: ok', {info: state._choosen_file})
  const {notice} = useAppApi()
  const records = useRecordsStore()
  const runtime = useRuntimeStore()
  const onError = async (): Promise<void> => {
    await notice(['IMPORTDATABASE: onError: FileReader'])
  }
  const onFileLoaded = async (): Promise<void> => {
    log('IMPORTDATABASE: onFileLoaded')
    if (typeof fr.result === 'string') {
      const FAKE_ACCOUNT_ID = 1
      const bkupObject: IBackup = JSON.parse(fr.result)
      let account: IAccount
      let booking: IBooking
      let transfer: Record<string, never>
      let bookingType: IBookingType
      let bookingTypeId: number
      let stock: Record<string, never>
      let credit = 0
      let debit = 0
      let costs = 0
      let tid = 1
      if (bkupObject.sm.cDBVersion === undefined) {
        await notice(['IMPORTDATABASE: onFileLoaded', 'Could not read backup file'])
      } else if (bkupObject.sm.cDBVersion < CONS.DB.MIN_VERSION) {
        await notice([t('dialogs.importDatabase.messageVersion', {version: CONS.DB.MIN_VERSION.toString()})])
      } else if (bkupObject.sm.cDBVersion === CONS.DB.MIN_VERSION) {
        if (records.accounts.length > 0) {
          await notice(['Die Daten können nur in eine leere Datenbank importiert werden.'])
        } else {
          // Create fake account
          records.cleanStore()
          records.addAccount({
            cID: FAKE_ACCOUNT_ID,
            cSwift: 'AAAAAAA0000',
            cNumber: 'XX00000000000000000000',
            cLogoUrl: CONS.LOGOS.NO_LOGO,
            cStockAccount: true
          })
          // file into stores (migration)
          for (stock of bkupObject.stocks) {
            const company = {
              cID: stock.cID,
              cISIN: stock.cISIN,
              cWKN: stock.cWKN,
              cSymbol: stock.cSym,
              cFadeOut: stock.cFadeOut,
              cFirstPage: stock.cFirstPage,
              cURL: stock.cURL,
              cCompany: stock.cCompany,
              cMeetingDay: toISODate(stock.cMeetingDay),
              cQuarterDay: toISODate(stock.cQuarterDay),
              cAccountNumberID: FAKE_ACCOUNT_ID,
            }
            records.addStock(company)
          }
          records.addBookingType({
            cID: 1,
            cName: 'Aktienkauf',
            cAccountNumberID: FAKE_ACCOUNT_ID
          })
          records.addBookingType({
            cID: 2,
            cName: 'Aktienverkauf',
            cAccountNumberID: FAKE_ACCOUNT_ID
          })
          records.addBookingType({
            cID: 3,
            cName: 'Dividende',
            cAccountNumberID: FAKE_ACCOUNT_ID
          })
          records.addBookingType({
            cID: 6,
            cName: 'Sonstiges',
            cAccountNumberID: FAKE_ACCOUNT_ID
          })
          for (transfer of bkupObject.transfers) {
            credit = 0
            debit = 0
            bookingTypeId = transfer.cType
            costs = -transfer.cFTax - transfer.cSTax - transfer.cFees - transfer.cTax - transfer.cSoli
            if (bookingTypeId === 1) { // buy
              debit = (transfer.cUnitQuotation * transfer.cCount) + costs
            } else if (bookingTypeId === 2) { // sell
              credit = -(transfer.cUnitQuotation * transfer.cCount) - costs
            } else if (bookingTypeId === 3) { // divs
              credit = transfer.cUnitQuotation * transfer.cCount - costs
            } else if (bookingTypeId === 4) { // in
              credit = transfer.cAmount - costs
              bookingTypeId = 6
            } else if (bookingTypeId === 5) { // out
              debit = -transfer.cAmount + costs
              bookingTypeId = 6
            }
            const booking: IBooking = {
              cID: tid,
              cDate: toISODate(transfer.cDate),
              cExDate: toISODate(transfer.cExDay),
              cCount: transfer.cCount < 0 ? -transfer.cCount : transfer.cCount,
              cDescription: transfer.cDescription,
              cBookingTypeID: bookingTypeId,
              cTransactionTax: -transfer.cFTax,
              cSourceTax: -transfer.cSTax,
              cFee: -transfer.cFees,
              cTax: -transfer.cTax,
              cMarketPlace: transfer.cMarketPlace,
              cSoli: -transfer.cSoli,
              cStockID: transfer.cStockID,
              cAccountNumberID: FAKE_ACCOUNT_ID,
              cCredit: credit,
              cDebit: debit
            }
            records.addBooking(booking)
            ++tid
          }
          //
          settings.setActiveAccountId(records.accounts[0].cID)
          runtime.setLogo()
          records.sumBookings()
          //
          const stores: IStores = {
            accounts: toRaw(records.accounts),
            bookings: toRaw(records.bookings),
            bookingTypes: toRaw(records.bookingTypes),
            stocks: toRaw(records.stocks)
          }
          appMessagePort.postMessage({type: CONS.MESSAGES.DB__ADD_STORES, data: stores})
        }
      } else {
        records.cleanStore()
        // file into stores
        for (account of bkupObject.accounts) {
          records.addAccount(account)
        }
        for (stock of bkupObject.stocks) {
          records.addStock(stock)
        }
        for (bookingType of bkupObject.booking_types) {
          if (bkupObject.accounts[0].cID === bookingType.cAccountNumberID) {
            records.addBookingType(bookingType)
          }
        }
        for (booking of bkupObject.bookings) {
          if (bkupObject.accounts[0].cID === booking.cAccountNumberID) {
            records.addBooking(booking)
          }
        }
        //
        settings.setActiveAccountId(records.accounts[0].cID)
        runtime.setLogo()
        records.sumBookings()
        //
        const stores: IStores = {
          accounts: bkupObject.accounts,
          bookings: bkupObject.bookings,
          bookingTypes: bkupObject.booking_types,
          stocks: bkupObject.stocks
        }
        appMessagePort.postMessage({type: CONS.MESSAGES.DB__ADD_STORES, data: stores})
      }
    }
  }
  const fr: FileReader = new FileReader()
  fr.addEventListener(CONS.EVENTS.LOAD, onFileLoaded, CONS.SYSTEM.ONCE)
  fr.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
  if (state._choosen_file !== null) {
    fr.readAsText(state._choosen_file, 'UTF-8')
  }
}
const title = t('dialogs.importDatabase.title')

defineExpose({ok, title})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-file-input
        accept=".json"
        v-bind:clearable="true"
        v-bind:label="t('dialogs.importDatabase.label')"
        variant="outlined"
        v-on:change="(ev: IEventTarget) => { state._choosen_file = ev.target.files[0] }"
      ></v-file-input>
    </v-card-text>
  </v-form>
</template>
