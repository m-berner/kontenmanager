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

const {t} = useI18n()
const {CONS, log, notice} = useAppApi()
const records = useRecordsStore()
const prefix = new Date().toISOString().substring(0, 10)
const fn = `${prefix}_${CONS.DB.START_VERSION}_${CONS.DB.NAME}.json`

const ok = async (): Promise<void> => {
  log('EXPORTDATABASE: ok')
  const stringifyDB = (): string => {
    let buffer: string
    let i: number
    buffer = '"accounts":[\n'
    for (i = 0; i < records.accounts.length; i++) {
      buffer += JSON.stringify({
        cSwift: records.accounts[i].cSwift,
        cNumber: records.accounts[i].cNumber,
        cLogoUrl: records.accounts[i].cLogoUrl,
        cStockAccount: records.accounts[i].cStockAccount,
        cID: records.accounts[i].cID
      })
      if (i === records.accounts.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''
    buffer += '"stocks":[\n'
    for (i = 0; i < records.stocks.length; i++) {
      buffer += JSON.stringify({
        cID: records.stocks[i].cID,
        cISIN: records.stocks[i].cISIN,
        cWKN: records.stocks[i].cWKN,
        cSymbol: records.stocks[i].cSymbol,
        cFadeOut: records.stocks[i].cFadeOut,
        cFirstPage: records.stocks[i].cFirstPage,
        cCompany: records.stocks[i].cCompany,
        cMeetingDay: records.stocks[i].cMeetingDay,
        cQuarterDay: records.stocks[i].cQuarterDay,
        cURL: records.stocks[i].cURL
      })
      if (i === records.stocks.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''
    buffer += '"booking_types":[\n'
    for (i = 0; i < records.bookingTypes.length; i++) {
      buffer += JSON.stringify({
        cID: records.bookingTypes[i].cID,
        cName: records.bookingTypes[i].cName,
        cAccountNumberID: records.bookingTypes[i].cAccountNumberID,
      })
      if (i === records.bookingTypes.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''
    buffer += '"bookings":[\n'
    for (i = 0; i < records.bookings.length; i++) {
      const booking: IBooking = {
        cID: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.ID],
        cDate: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.DATE],
        cDebit: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.DEBIT],
        cCredit: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.CREDIT],
        cDescription: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.DESCRIPTION],
        cBookingTypeID: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID],
        cAccountNumberID: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID],
        cCount: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.COUNT],
        cStockID: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID],
        cSoli: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.SOLI],
        cTax: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.TAX],
        cFee: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.FEE],
        cSourceTax: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.SOURCE_TAX],
        cTransactionTax: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.TRANSACTION_TAX],
        cMarketPlace: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.MARKET_PLACE],
        cExDate: records.bookings[i][CONS.DB.STORES.BOOKINGS.FIELDS.EX_DATE]
      }
      buffer += JSON.stringify(booking)
      if (i === records.bookings.length - 1) {
        buffer += '\n]\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? ']\n' : ''
    return buffer
  }
  let buffer = `{\n"sm": {"cVersion":${browser.runtime.getManifest().version.replace(/\./g, '')}, "cDBVersion":${
    CONS.DB.START_VERSION
  }, "cEngine":"indexeddb"},\n`
  buffer += stringifyDB()
  buffer += '}'
  const blob = new Blob([buffer], {type: 'application/json'}) // create blob object with all stores data
  const blobUrl = URL.createObjectURL(blob) // create url reference for blob object
  const op: browser.downloads._DownloadOptions = {
    url: blobUrl,
    filename: fn
  }
  const onDownloadChange = (change: browser.downloads._OnChangedDownloadDelta): void => {
    log('HEADERBAR: onChanged')
    // noinspection JSDeprecatedSymbols
    browser.downloads.onChanged.removeListener(onDownloadChange)
    if (
      (change.state !== undefined && change.id > 0) ||
      (change.state !== undefined && change.state.current === CONS.EVENTS.COMP)
    ) {
      URL.revokeObjectURL(blobUrl) // release blob object
    }
  }
  // noinspection JSDeprecatedSymbols
  browser.downloads.onChanged.addListener(onDownloadChange) // listener to clean up blob object after download.
  await browser.downloads.download(op) // writing blob object into download file
  await notice(['Database exported!'])
}
const title = t('dialogs.exportDatabase.title')

defineExpose({ok, title})

log('--- ExportDatabase.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-textarea
        v-bind:disabled="true"
        v-bind:modelValue="t('dialogs.exportDialog', { filename: fn })"
        variant="outlined"
      ></v-textarea>
    </v-card-text>
  </v-form>
</template>
