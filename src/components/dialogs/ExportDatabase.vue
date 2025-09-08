<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccountDB, IBookingDB, IBookingTypeDB, IStockDB} from '@/types'
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {getAllAccounts} = useAccountsDB()
const {getAllBookings} = useBookingsDB()
const {getAllBookingTypes} = useBookingTypesDB()
const {getAllStocks} = useStocksDB()

const prefix = new Date().toISOString().substring(0, 10)
const fn = `${prefix}_${CONS.INDEXED_DB.CURRENT_VERSION}_${CONS.INDEXED_DB.NAME}.json`
const localeText = t('dialogs.exportDialog', {filename: fn})

const onClickOk = async (): Promise<void> => {
  log('EXPORT_DATABASE : onClickOk')
  const accounts: IAccountDB[] = await getAllAccounts()
  const bookings: IBookingDB[] = await getAllBookings()
  const stocks: IStockDB[] = await getAllStocks()
  const bookingTypes: IBookingTypeDB[] = await getAllBookingTypes()
  const stringifyDB = (): string => {
    let buffer: string
    let i: number
    buffer = '"accounts":[\n'
    for (i = 0; i < accounts.length; i++) {
      buffer += JSON.stringify(accounts[i])
      if (i === accounts.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''

    buffer += '"stocks":[\n'
    for (i = 0; i < stocks.length; i++) {
      buffer += JSON.stringify(stocks[i])
      if (i === stocks.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''
    buffer += '"bookingTypes":[\n'
    for (i = 0; i < bookingTypes.length; i++) {
      buffer += JSON.stringify(bookingTypes[i])
      if (i === bookingTypes.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''
    buffer += '"bookings":[\n'
    for (i = 0; i < bookings.length; i++) {
      buffer += JSON.stringify(bookings[i])
      if (i === bookings.length - 1) {
        buffer += '\n]\n'
      } else {
        buffer += ',\n'
      }
    }
    return buffer
  }
  let buffer = `{\n"sm": {"cVersion":${browser.runtime.getManifest().version.replace(/\./g, '')}, "cDBVersion":${CONS.INDEXED_DB.CURRENT_VERSION}, "cEngine":"indexeddb"},\n`
  buffer += stringifyDB()
  buffer += '}'

  const blob = new Blob([buffer], {type: 'application/json'}) // create blob object with all stores data
  const blobUrl = URL.createObjectURL(blob) // create url reference for blob object
  const op: browser.downloads._DownloadOptions = {
    url: blobUrl,
    filename: fn
  }

  await browser.downloads.download(op) // writing blob object into download file
  await notice(['Database exported!'])
  const onDownloadChange = (change: browser.downloads._OnChangedDownloadDelta): void => {
    log('USE_INDEXED_DB: onDownloadChange')
    browser.downloads.onChanged.removeListener(onDownloadChange)
    if ((change.state !== undefined && change.id > 0) || (change.state !== undefined && change.state.current === CONS.EVENTS.COMPLETE)) {
      URL.revokeObjectURL(blobUrl) // release blob object
    }
  }
  browser.downloads.onChanged.addListener(onDownloadChange) // listener to clean up a blob object after the download.
}
const title = t('dialogs.exportToFile.title')
defineExpose({onClickOk, title})

log('--- ExportDatabase.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-textarea
            :disabled="true"
            :model-value="localeText"
            variant="outlined"/>
      </v-card-text>
    </v-card>
  </v-form>
</template>
