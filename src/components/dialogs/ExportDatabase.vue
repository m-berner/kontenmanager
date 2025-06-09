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
    const accountIDs: number[] = []
    let buffer: string
    let i: number
    buffer = '"accounts":[\n'
    for (i = 0; i < records.accounts.length; i++) {
      accountIDs.push(records.accounts[i].cID)
      buffer += JSON.stringify(records.accounts[i])
      if (i === records.accounts.length - 1) {
        buffer += '\n],\n'
      } else {
        buffer += ',\n'
      }
    }
    buffer += i === 0 ? '],\n' : ''

    for (let j = 0; j < accountIDs.length; j++) {
      console.error(accountIDs) // TODO ...
      buffer += `"account_${accountIDs[j]}":{\n`

      buffer += '"stocks":[\n'
      for (i = 0; i < records.stocks.length; i++) {
        buffer += JSON.stringify(records.stocks[i])
        if (i === records.stocks.length - 1) {
          buffer += '\n],\n'
        } else {
          buffer += ',\n'
        }
      }
      buffer += i === 0 ? '],\n' : ''
      buffer += '"booking_types":[\n'
      for (i = 0; i < records.bookingTypes.length; i++) {
        buffer += JSON.stringify(records.bookingTypes[i])
        if (i === records.bookingTypes.length - 1) {
          buffer += '\n],\n'
        } else {
          buffer += ',\n'
        }
      }
      //TODO currently only the active account will be exported?
      buffer += i === 0 ? '],\n' : ''
      buffer += '"bookings":[\n'
      for (i = 0; i < records.bookings.length; i++) {
        buffer += JSON.stringify(records.bookings[i])
        if (i === records.bookings.length - 1) {
          buffer += '\n]\n'
        } else {
          buffer += ',\n'
        }
      }
      buffer += i === 0 ? ']\n}\n' : '}\n'

    }
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
