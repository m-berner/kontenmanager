<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {
  IAccount_DB,
  IAccount_Store,
  IBooking_DB,
  IBooking_Store,
  IBookingType_DB,
  IBookingType_Store,
  IRecords_DB,
  IStock_DB,
  IStock_Store
} from '@/types.d'
import type {UnwrapRef} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'

interface IStock_SM {
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

interface IBooking_SM {
  cDate: number
  cExDay: number
  cUnitQuotation: number
  cAmount: number
  cDescription: string
  cCount: number
  cType: number
  cStockID: number
  cSoli: number
  cTax: number
  cFees: number
  cSTax: number
  cFTax: number
  cMarketPlace: string
}

interface IBackup {
  sm: {
    cVersion: number
    cDBVersion: number
    cEngine: string
  }
  accounts: IAccount_Store[]
  bookings: IBooking_DB[]
  bookingTypes: IBookingType_Store[]
  stocks: IStock_Store[] & IStock_SM[]
  transfers?: IBooking_SM[]
}

interface IEventTarget extends HTMLInputElement {
  target: { files: UnwrapRef<Blob>[] }
}

const {t} = useI18n()
const {CONS, log, isoDate} = useApp()
const {notice, setStorage} = useBrowser()
const {clear: clearAllAccounts, batchImport: importAccounts} = useAccountsDB()
const {clear: clearAllBookings, batchImport: importBookings} = useBookingsDB()
const {clear: clearAllBookingTypes, batchImport: importBookingTypes} = useBookingTypesDB()
const {clear: clearAllStocks, batchImport: importStocks} = useStocksDB()
const {resetTeleport} = useRuntime()
const {activeAccountId} = useSettings()
const {info} = useAlertStore()

const MESSAGES = Object.freeze({
  INFO_TITLE: t('appPage.messages.infoTitle'),
  RESTRICTED_IMPORT: t('appPage.messages.restrictedImport'),
  IMPORT_TITLE: t('dialogs.importDatabase.title'),
  VERSION: t('dialogs.importDatabase.version'),
  NOT_EMPTY: t('dialogs.importDatabase.notEmpty'),
  INVALID: t('dialogs.importDatabase.invalid')
})

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
    const accountsImportData: IRecords_DB[] = []
    const bookingsImportData: IRecords_DB[] = []
    const bookingTypesImportData: IRecords_DB[] = []
    const stocksImportData: IRecords_DB[] = []
    const accountsStoreData: IAccount_DB[] = []
    const bookingsDbData: IBooking_DB[] = []
    const bookingTypesStoreData: IBookingType_DB[] = []
    const stocksStoreData: IStock_DB[] = []
    if (typeof fr.result === 'string') {
      const backupObject: IBackup = JSON.parse(fr.result)
      const activeId = backupObject.accounts !== undefined ? backupObject.accounts[0].cID : 1
      activeAccountId.value = activeId
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeId)
      const getCreditDebit = (rec: IBooking_SM): number => {
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
        info(MESSAGES.IMPORT_TITLE, MESSAGES.INVALID, null)
        return
      } else if (backupObject.sm.cDBVersion < CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        info(MESSAGES.IMPORT_TITLE, MESSAGES.VERSION, null)
        return
      } else if (backupObject.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION && records.accounts.items.length > 0) {
        info(MESSAGES.IMPORT_TITLE, MESSAGES.NOT_EMPTY, null)
        return
      } else if (backupObject.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION && records.accounts.items.length === 0) {
        records.clean()
        await clearAllAccounts()
        await clearAllBookings()
        await clearAllBookingTypes()
        await clearAllStocks()
        const accountRecords = [{
          cID: activeId,
          cSwift: 'KMKLPJJ9',
          cIban: 'XX13120300001064506999',
          cLogoUrl: '',
          cWithDepot: true
        }]
        const bookingTypeRecords = [
          {cID: 1, cName: 'Aktienkauf', cAccountNumberID: activeId},
          {cID: 2, cName: 'Aktienverkauf', cAccountNumberID: activeId},
          {cID: 3, cName: 'Dividende', cAccountNumberID: activeId},
          {cID: 4, cName: 'Einzahlung', cAccountNumberID: activeId},
          {cID: 5, cName: 'Auszahlung', cAccountNumberID: activeId}
        ]
        for (const rec of accountRecords) {
          accountsStoreData.push(rec)
          accountsImportData.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of bookingTypeRecords) {
          bookingTypesStoreData.push(rec)
          bookingTypesImportData.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of backupObject.stocks) {
          const stockClone: IStock_Store = {} as IStock_Store
          stockClone.cID = rec.cID
          stockClone.cAccountNumberID = activeId
          stockClone.cSymbol = rec.cSym
          stockClone.cMeetingDay = isoDate(rec.cMeetingDay)
          stockClone.cQuarterDay = isoDate(rec.cQuarterDay)
          stockClone.cCompany = rec.cCompany
          stockClone.cISIN = rec.cISIN
          stockClone.cFadeOut = rec.cFadeOut
          stockClone.cFirstPage = rec.cFirstPage
          stockClone.cFirstPage = rec.cFirstPage
          stockClone.cURL = rec.cURL
          stockClone.cAskDates = CONS.DATE.DEFAULT_ISO
          stocksImportData.push({type: 'add', data: stockClone, key: -1})
          stocksStoreData.push(stockClone)
        }
        for (let i = 0; backupObject.transfers && i < backupObject.transfers.length; i++) {
          const booking: IBooking_Store = {} as IBooking_Store
          const smTransfer: IBooking_SM = backupObject.transfers[i]
          booking.cID = i + 1
          booking.cAccountNumberID = activeId
          booking.cStockID = smTransfer.cStockID
          booking.cBookDate = isoDate(smTransfer.cDate)
          booking.cBookingTypeID = smTransfer.cType
          booking.cExDate = isoDate(smTransfer.cExDay)
          booking.cCount = smTransfer.cCount < 0 ? -smTransfer.cCount : smTransfer.cCount
          booking.cDescription = smTransfer.cDescription
          booking.cTransactionTaxCredit = smTransfer.cFTax > 0 ? smTransfer.cFTax : 0
          booking.cTransactionTaxDebit = smTransfer.cFTax < 0 ? -smTransfer.cFTax : 0
          booking.cSourceTaxCredit = smTransfer.cSTax > 0 ? smTransfer.cSTax : 0
          booking.cSourceTaxDebit = smTransfer.cSTax < 0 ? -smTransfer.cSTax : 0
          booking.cFeeCredit = smTransfer.cFees > 0 ? smTransfer.cFees : 0
          booking.cFeeDebit = smTransfer.cFees < 0 ? -smTransfer.cFees : 0
          booking.cTaxCredit = smTransfer.cTax > 0 ? smTransfer.cTax : 0
          booking.cTaxDebit = smTransfer.cTax < 0 ? -smTransfer.cTax : 0
          booking.cSoliCredit = smTransfer.cSoli > 0 ? smTransfer.cSoli : 0
          booking.cSoliDebit = smTransfer.cSoli < 0 ? -smTransfer.cSoli : 0
          booking.cMarketPlace = smTransfer.cMarketPlace
          booking.cDebit = smTransfer.cType === 1 || smTransfer.cType === 5 ? getCreditDebit(smTransfer) : 0
          booking.cCredit = smTransfer.cType === 2 || smTransfer.cType === 3 || smTransfer.cType === 4 ? getCreditDebit(smTransfer) : 0
          bookingsDbData.push(booking)
          bookingsImportData.push({type: 'add', data: booking, key: -1})
        }
      } else if (backupObject.sm.cDBVersion > CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        records.clean()
        await clearAllAccounts()
        await clearAllBookings()
        await clearAllBookingTypes()
        await clearAllStocks()
        for (const rec of backupObject.accounts) {
          accountsStoreData.push(rec)
          accountsImportData.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of backupObject.stocks) {
          stocksStoreData.push(rec)
          stocksImportData.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of backupObject.bookingTypes) {
          bookingTypesStoreData.push(rec)
          bookingTypesImportData.push({type: 'add', data: rec, key: -1})
        }
        for (const rec of backupObject.bookings) {
          bookingsDbData.push(rec)
          bookingsImportData.push({type: 'add', data: rec, key: -1})
        }
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
      records.init({
        accountsDB: accountsStoreData,
        bookingsDB: bookingsDbData.filter(rec => rec.cAccountNumberID === activeId),
        bookingTypesDB: bookingTypesStoreData.filter(rec => rec.cAccountNumberID === activeId),
        stocksDB: stocksStoreData.filter(rec => rec.cAccountNumberID === activeId)
      }, MESSAGES)
      await importAccounts(accountsImportData)
      await importBookingTypes(bookingTypesImportData)
      await importBookings(bookingsImportData)
      await importStocks(stocksImportData)
      resetTeleport()
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
