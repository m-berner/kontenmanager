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
import {reactive} from 'vue'

interface IEventTarget extends HTMLInputElement {
  target: { files: File[] }
}

const {t} = useI18n()
const {CONS, log} = useAppApi()
const settings = useSettingsStore()

const state = reactive({
  _choosen_file: new Blob()
})

const ok = async (): Promise<void> => {
  log('IMPORT_DATABASE: ok', {info: state._choosen_file})
  const {notice} = useAppApi()
  const records = useRecordsStore()
  const runtime = useRuntimeStore()
  const onError = async (): Promise<void> => {
    await notice(['IMPORT_DATABASE: onError: FileReader'])
  }
  const onFileLoaded = async (): Promise<void> => {
    log('IMPORT_DATABASE: onFileLoaded')
    if (typeof fr.result === 'string') {
      const bkupObject: IBackup = JSON.parse(fr.result)
      const accounts = []
      const bookings = []
      const bookingTypes = []
      const stocks = []
      let account: IAccount
      let booking: IBooking
      let bookingType: IBookingType
      let stock: IStock
      let activeId: number
      if (bkupObject.sm.cDBVersion === undefined) {
        await notice(['IMPORT_DATABASE: onFileLoaded', 'Could not read backup file'])
      } else if (bkupObject.sm.cDBVersion <= CONS.DB.IMPORT_MIN_VERSION) {
        await notice([t('dialogs.importDatabase.messageVersion', {version: CONS.DB.IMPORT_MIN_VERSION.toString()})])
      } else if (bkupObject.sm.cDBVersion > CONS.DB.IMPORT_MIN_VERSION) {
        records.cleanStore()
        for (account of bkupObject.accounts) {
          records.addAccount(account)
          accounts.push(account)
        }
        activeId = records.accounts[0].cID
        for (stock of bkupObject.stocks) {
          if (stock.cAccountNumberID === activeId) {
            records.addStock(stock)
          }
          stocks.push(stock)
        }
        for (bookingType of bkupObject.booking_types) {
          if (bookingType.cAccountNumberID === activeId) {
            records.addBookingType(bookingType)
          }
          bookingTypes.push(bookingType)
        }
        for (booking of bkupObject.bookings) {
          if (booking.cAccountNumberID === activeId) {
            records.addBooking(booking)
          }
          bookings.push(booking)
        }
        settings.setActiveAccountId(activeId)
        runtime.setLogo()
        records.sumBookings()

        const stores: IStores = {
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
        v-on:change="(ev: IEventTarget) => { state._choosen_file = ev.target.files[0] }"></v-file-input>
    </v-card-text>
  </v-form>
</template>
