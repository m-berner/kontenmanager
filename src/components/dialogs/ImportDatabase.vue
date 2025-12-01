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
} from '@/types'
import type {UnwrapRef} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'

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
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const {info} = useAlertStore()

const T = Object.freeze({
  MESSAGES: {
    INFO_TITLE: t('messages.infoTitle'),
    RESTRICTED_IMPORT: t('messages.restrictedImport')
  },
  STRINGS: {
    TITLE: t('dialogs.importDatabase.title'),
    VERSION: t('dialogs.importDatabase.version'),
    NOT_EMPTY: t('dialogs.importDatabase.notEmpty'),
    INVALID: t('dialogs.importDatabase.invalid'),
    MESSAGE_DELETE: t('dialogs.importDatabase.messageDelete'),
    FILE_LABEL: t('dialogs.importDatabase.fileLabel'),
    TAX: t('dialogs.importDatabase.tax'),
    CAPITAL_TAX: t('dialogs.importDatabase.capitalTax'),
    FEE: t('dialogs.importDatabase.fee'),
    SOLI: t('dialogs.importDatabase.soli'),
    SOURCE_TAX: t('dialogs.importDatabase.sourceTax'),
    TRANSACTION_TAX: t('dialogs.importDatabase.transactionTax'),
    OTHERS: t('dialogs.importDatabase.others'),
    SHARE_BUY: t('dialogs.importDatabase.shareBuy'),
    SHARE_SELL: t('dialogs.importDatabase.shareSell'),
    DIVIDEND: t('dialogs.importDatabase.dividend')
  }
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
    const STOCKMANAGER_RESTORE_ACCOUNT_ID = 1
    const {activeAccountId} = storeToRefs(settings)
    const {items: accountItems} = storeToRefs(records.accounts)
    const accountsImportData: IRecords_DB[] = []
    const bookingsImportData: IRecords_DB[] = []
    const bookingTypesImportData: IRecords_DB[] = []
    const stocksImportData: IRecords_DB[] = []
    const accountsStoreData: IAccount_DB[] = []
    const bookingsStoreData: IBooking_DB[] = []
    const bookingTypesStoreData: IBookingType_DB[] = []
    const stocksStoreData: IStock_DB[] = []
    if (typeof fr.result === 'string') {
      const backupObject: IBackup = JSON.parse(fr.result)
      const activeId = backupObject.accounts !== undefined ? backupObject.accounts[0].cID : STOCKMANAGER_RESTORE_ACCOUNT_ID
      activeAccountId.value = activeId
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeId)
      const getCreditDebit = (rec: IBooking_SM): { value: number, type: number } => {
        let result: { value: number, type: number } = {value: 0, type: -1}
        if (rec.cAmount !== 0) {
          result.type = 4
        } else if (rec.cFees !== 0) {
          result.type = 5
        } else if (rec.cTax !== 0 || rec.cSoli !== 0 || rec.cSTax !== 0 || rec.cFTax !== 0) {
          result.type = 6
        }
        switch (rec.cType) {
          case 1:
            // Buy
            result = {value: rec.cUnitQuotation * rec.cCount, type: 1}
            break
          case 2:
            // Sell
            result = {value: rec.cUnitQuotation * -rec.cCount, type: 2}
            break
          case 3:
            // Dividend
            result = {value: rec.cUnitQuotation * rec.cCount, type: 3}
            break
          case 4:
            // Credit
            result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli
            break
          case 5:
            // Debit
            result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli
            break
          default:
            throw new Error('IMPORT_DATABASE: undefined type')
        }
        return result
      }

      if (!Object.keys(backupObject.sm).includes('cDBVersion')) {
        info(T.STRINGS.TITLE, T.STRINGS.INVALID, null)
        return
      } else if (backupObject.sm.cDBVersion < CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        info(T.STRINGS.TITLE, T.STRINGS.VERSION, null)
        return
      } else if (backupObject.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION && accountItems.value.length > 0) {
        info(T.STRINGS.TITLE, T.STRINGS.NOT_EMPTY, null)
        return
      }
      await clearAllAccounts()
      await clearAllBookings()
      await clearAllBookingTypes()
      await clearAllStocks()
      if (backupObject.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION && accountItems.value.length === 0) {
        const accountRecords = [{
          cID: activeId,
          cSwift: 'KMKLPJJ9',
          cIban: 'XX13120300001064506999',
          cLogoUrl: '',
          cWithDepot: true
        }]
        const bookingTypeRecords = [
          {cID: 1, cName: T.STRINGS.SHARE_BUY, cAccountNumberID: activeId},
          {cID: 2, cName: T.STRINGS.SHARE_SELL, cAccountNumberID: activeId},
          {cID: 3, cName: T.STRINGS.DIVIDEND, cAccountNumberID: activeId},
          {cID: 4, cName: T.STRINGS.OTHERS, cAccountNumberID: activeId},
          {cID: 5, cName: T.STRINGS.FEE, cAccountNumberID: activeId},
          {cID: 6, cName: T.STRINGS.TAX, cAccountNumberID: activeId}
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
          booking.cMarketPlace = smTransfer.cMarketPlace
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
          booking.cCredit = smTransfer.cAmount > 0 ? smTransfer.cAmount : 0
          booking.cDebit = smTransfer.cAmount < 0 ? -smTransfer.cAmount : 0
          if (smTransfer.cType === 1) {
            booking.cDebit = getCreditDebit(smTransfer).value
            booking.cCredit = 0
          } else if (smTransfer.cType === 2) {
            booking.cCredit = getCreditDebit(smTransfer).value
            booking.cDebit = 0
          } else if (smTransfer.cType === 3) {
            booking.cCredit = getCreditDebit(smTransfer).value
            booking.cDebit = 0
          } else if (smTransfer.cType === 4) {
            booking.cBookingTypeID = getCreditDebit(smTransfer).type
            booking.cCredit = getCreditDebit(smTransfer).value
            booking.cDebit = 0
            booking.cFeeCredit = 0
            booking.cFeeDebit = 0
            booking.cTransactionTaxCredit = 0
            booking.cTransactionTaxDebit = 0
            booking.cSourceTaxCredit = 0
            booking.cSourceTaxDebit = 0
            booking.cTaxCredit = 0
            booking.cTaxDebit = 0
            booking.cSoliCredit = 0
            booking.cSoliDebit = 0
          } else if (smTransfer.cType === 5) {
            booking.cBookingTypeID = getCreditDebit(smTransfer).type
            booking.cCredit = 0
            booking.cDebit = getCreditDebit(smTransfer).value
            booking.cFeeCredit = 0
            booking.cFeeDebit = 0
            booking.cTransactionTaxCredit = 0
            booking.cTransactionTaxDebit = 0
            booking.cSourceTaxCredit = 0
            booking.cSourceTaxDebit = 0
            booking.cTaxCredit = 0
            booking.cTaxDebit = 0
            booking.cSoliCredit = 0
            booking.cSoliDebit = 0
          }
          bookingsStoreData.push(booking)
          bookingsImportData.push({type: 'add', data: booking, key: -1})
        }
      } else if (backupObject.sm.cDBVersion > CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
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
          bookingsStoreData.push(rec)
          bookingsImportData.push({type: 'add', data: rec, key: -1})
        }
      } else {
        await notice(['IMPORT_DATABASE: system error'])
      }
      records.init({
        accountsDB: accountsStoreData,
        bookingsDB: bookingsStoreData.filter(rec => rec.cAccountNumberID === activeId),
        bookingTypesDB: bookingTypesStoreData.filter(rec => rec.cAccountNumberID === activeId),
        stocksDB: stocksStoreData.filter(rec => rec.cAccountNumberID === activeId)
      }, T.MESSAGES)
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
const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
  <v-form
      validate-on="submit"
      @submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          :label="T.STRINGS.MESSAGE_DELETE"
          variant="plain"
      />
      <v-file-input
          :clearable="true"
          :label="T.STRINGS.FILE_LABEL"
          accept=".json"
          variant="outlined"
          @change="onChange"/>
    </v-card-text>
  </v-form>
</template>
