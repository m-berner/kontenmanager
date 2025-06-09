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
  _choosen_file: new Blob(),
  _clean_db: true,
  _id: '1'
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
      } else if (bkupObject.sm.cDBVersion === CONS.DB.MIN_VERSION && state._clean_db) {
        records.cleanStore()
        records.addAccount({
          cID: Number.parseInt(state._id),
          cSwift: 'AAAAAAA0000',
          cNumber: 'XX00000000000000000000',
          cLogoUrl: CONS.LOGOS.NO_LOGO,
          cStockAccount: true
        })
        records.addStock({
          cID: 0,
          cISIN: 'XX00000000000000000000',
          cWKN: 'AAAAAA',
          cSymbol: 'WWW',
          cFadeOut: 0,
          cFirstPage: 0,
          cURL: '',
          cCompany: '',
          cMeetingDay: '',
          cQuarterDay: '',
          cAccountNumberID: Number.parseInt(state._id)
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
            cAccountNumberID: Number.parseInt(state._id)
          }
          records.addStock(company)
        }
        records.addBookingType({
          cID: 1,
          cName: 'Aktienkauf',
          cAccountNumberID: Number.parseInt(state._id)
        })
        records.addBookingType({
          cID: 2,
          cName: 'Aktienverkauf',
          cAccountNumberID: Number.parseInt(state._id)
        })
        records.addBookingType({
          cID: 3,
          cName: 'Dividende',
          cAccountNumberID: Number.parseInt(state._id)
        })
        records.addBookingType({
          cID: 6,
          cName: 'Sonstiges',
          cAccountNumberID: Number.parseInt(state._id)
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
            credit = (transfer.cUnitQuotation * transfer.cCount) - costs
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
            cAccountNumberID: Number.parseInt(state._id),
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
          stocks: toRaw(records.stocks),
          clean: true
        }
        appMessagePort.postMessage({type: CONS.MESSAGES.DB__ADD_STORES, data: stores})
      } else if (bkupObject.sm.cDBVersion > CONS.DB.MIN_VERSION) {
        const bookingArray = []
        if (state._clean_db) {
          records.cleanStore()
        }
        // file into stores
        for (account of bkupObject.accounts) {
          if (account.cID === Number.parseInt(state._id)) {
            records.updateAccount(account)
          } else {
            records.addAccount(account)
          }
        }
        for (stock of bkupObject.stocks) {
          records.addStock(stock)
        }
        for (bookingType of bkupObject.booking_types) {
          records.addBookingType(bookingType)
        }
        for (booking of bkupObject.bookings) {
          const bookingClone = {
            ...booking,
            cCount: 0,
            cTransactionTax: 0,
            cSourceTax: 0,
            cTax: 0,
            cFee: 0,
            cSoli: 0,
            cMarketPlace: ''
          }
          records.addBooking(bookingClone)
          bookingArray.push(bookingClone)
        }
        //
        settings.setActiveAccountId(records.accounts[0].cID)
        runtime.setLogo()
        records.sumBookings()

        const stores: IStores = {
          accounts: toRaw(records.accounts),
          bookings: bookingArray,
          bookingTypes: bkupObject.booking_types,
          stocks: bkupObject.stocks,
          clean: state._clean_db
        }
        appMessagePort.postMessage({type: CONS.MESSAGES.DB__ADD_STORES, data: stores})
      } else {
        await notice(['dfsfsf'])
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
      <v-switch
        v-model="state._clean_db"
        color="secondary"
        v-bind:label="t('dialogs.importDatabase.databaseLabel')"></v-switch>
      <v-text-field
        v-model="state._id"
        class="withoutSpinner"
        max-width="120"
        type="number"
        v-bind:label="t('dialogs.importDatabase.fakeLabel')"
        variant="outlined"></v-text-field>
      <v-file-input
        accept=".json"
        v-bind:clearable="true"
        v-bind:label="t('dialogs.importDatabase.label')"
        variant="outlined"
        v-on:change="(ev: IEventTarget) => { state._choosen_file = ev.target.files[0] }"></v-file-input>
    </v-card-text>
  </v-form>
</template>
