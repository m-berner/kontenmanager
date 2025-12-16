<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Account_DB, I_Backup, I_Booking_DB, I_Event_Target, I_Records, I_Stock_DB} from '@/types'
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
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useImportExport} from '@/composables/useImportExport'

const {t} = useI18n()
const {CONS, log, isoDate} = useApp()
const {notice, setStorage} = useBrowser()
const {clear: clearAllAccounts, batchImport: importAccounts} = useAccountsDB()
const {clear: clearAllBookings, batchImport: importBookings} = useBookingsDB()
const {clear: clearAllBookingTypes, batchImport: importBookingTypes} = useBookingTypesDB()
const {clear: clearAllStocks, batchImport: importStocks} = useStocksDB()
const {isLoading, handleError, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const {info} = useAlertStore()
const {ImportExportService} = useImportExport()

const T = Object.freeze(
    {
        MESSAGES: {
            INFO_TITLE: t('messages.infoTitle'),
            RESTRICTED_IMPORT: t('messages.restrictedImport')
        },
        STRINGS: {
            TITLE: t('components.dialogs.importDatabase.title'),
            VERSION: t('components.dialogs.importDatabase.version'),
            NOT_EMPTY: t('components.dialogs.importDatabase.notEmpty'),
            INVALID: t('components.dialogs.importDatabase.invalid'),
            MESSAGE_DELETE: t('components.dialogs.importDatabase.messageDelete'),
            FILE_LABEL: t('components.dialogs.importDatabase.fileLabel'),
            TAX: t('names.bookingTypes.tax'),
            CAPITAL_TAX: t('components.dialogs.importDatabase.capitalTax'),
            FEE: t('names.bookingTypes.fee'),
            SOLI: t('components.dialogs.importDatabase.soli'),
            SOURCE_TAX: t('components.dialogs.importDatabase.sourceTax'),
            TRANSACTION_TAX: t('components.dialogs.importDatabase.transactionTax'),
            OTHERS: t('names.bookingTypes.other'),
            SHARE_BUY: t('names.bookingTypes.buy'),
            SHARE_SELL: t('names.bookingTypes.sell'),
            DIVIDEND: t('names.bookingTypes.dividend')
        }
    }
)

const fileBlob = ref<Blob>(new Blob())
const importService = new ImportExportService(CONS, isoDate)

const onChange = (ev: I_Event_Target) => {
    fileBlob.value = ev.target.files[0]
}

const validateBackup = (backup: I_Backup, accountItems: I_Account_DB[]): string | null => {
    if (!Object.keys(backup.sm).includes('cDBVersion')) {
        return T.STRINGS.INVALID
    }

    if (backup.sm.cDBVersion < CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        return T.STRINGS.VERSION
    }

    if (backup.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION && accountItems.length > 0) {
        return T.STRINGS.NOT_EMPTY
    }

    return null
}

const createDefaultAccount = (activeId: number) => ({
    cID: activeId,
    cSwift: 'KMKLPJJ9',
    cIban: 'XX13120300001064506999',
    cLogoUrl: '',
    cWithDepot: true
})

const createDefaultBookingTypes = (activeId: number) => [
    {cID: 1, cName: T.STRINGS.SHARE_BUY, cAccountNumberID: activeId},
    {cID: 2, cName: T.STRINGS.SHARE_SELL, cAccountNumberID: activeId},
    {cID: 3, cName: T.STRINGS.DIVIDEND, cAccountNumberID: activeId},
    {cID: 4, cName: T.STRINGS.OTHERS, cAccountNumberID: activeId},
    {cID: 5, cName: T.STRINGS.FEE, cAccountNumberID: activeId},
    {cID: 6, cName: T.STRINGS.TAX, cAccountNumberID: activeId}
]

const importLegacyData = async (
    backup: I_Backup,
    activeId: number
): Promise<void> => {
    const accountsImportData: I_Records[] = []
    const bookingsImportData: I_Records[] = []
    const bookingTypesImportData: I_Records[] = []
    const stocksImportData: I_Records[] = []

    // Create default account and booking types
    const account = createDefaultAccount(activeId)
    accountsImportData.push({type: 'add', data: account, key: -1})

    const bookingTypes = createDefaultBookingTypes(activeId)
    for (const bt of bookingTypes) {
        bookingTypesImportData.push({type: 'add', data: bt, key: -1})
    }

    // Transform stocks
    for (const rec of backup.stocks) {
        const stock = importService.transformLegacyStock(rec, activeId)
        stocksImportData.push({type: 'add', data: stock, key: -1})
    }

    // Transform bookings
    if (backup.transfers) {
        for (let i = 0; i < backup.transfers.length; i++) {
            const booking = importService.transformLegacyBooking(backup.transfers[i], i, activeId)
            bookingsImportData.push({type: 'add', data: booking, key: -1})
        }
    }

    // Import all data
    await importAccounts(accountsImportData)
    await importBookingTypes(bookingTypesImportData)
    await importStocks(stocksImportData)
    await importBookings(bookingsImportData)

    // Initialize records store
    const records = useRecordsStore()
    records.init(
        {
            accountsDB: [account],
            bookingsDB: bookingsImportData.map(r => r.data as I_Booking_DB).filter(b => b.cAccountNumberID === activeId),
            bookingTypesDB: bookingTypes,
            stocksDB: stocksImportData.map(r => r.data as I_Stock_DB).filter(s => s.cAccountNumberID === activeId)
        }, T.MESSAGES)
}

const importModernData = async (backup: I_Backup, activeId: number): Promise<void> => {
    const accountsImportData: I_Records[] = backup.accounts.map(rec => ({type: 'add', data: rec, key: -1}))
    const stocksImportData: I_Records[] = backup.stocks.map(rec => ({type: 'add', data: rec, key: -1}))
    const bookingTypesImportData: I_Records[] = backup.bookingTypes.map(rec => ({type: 'add', data: rec, key: -1}))
    const bookingsImportData: I_Records[] = backup.bookings.map(rec => ({type: 'add', data: rec, key: -1}))

    await importAccounts(accountsImportData)
    await importBookingTypes(bookingTypesImportData)
    await importStocks(stocksImportData)
    await importBookings(bookingsImportData)

    const records = useRecordsStore()
    records.init(
        {
            accountsDB: backup.accounts,
            bookingsDB: backup.bookings.filter(rec => rec.cAccountNumberID === activeId),
            bookingTypesDB: backup.bookingTypes.filter(rec => rec.cAccountNumberID === activeId),
            stocksDB: backup.stocks.filter(rec => rec.cAccountNumberID === activeId)
        }, T.MESSAGES)
}

const processBackupFile = async (fileContent: string): Promise<void> => {
    const records = useRecordsStore()
    const {activeAccountId} = storeToRefs(settings)
    const {items: accountItems} = storeToRefs(records.accounts)

    const backup: I_Backup = JSON.parse(fileContent)

    // Validate backup
    const validationError = validateBackup(backup, accountItems.value)
    if (validationError) {
        info(T.STRINGS.TITLE, validationError, null)
        return
    }

    // Set active account
    const activeId = backup.accounts?.[0]?.cID ?? CONS.INDEXED_DB.STOCKMANAGER_RESTORE_ACCOUNT_ID
    activeAccountId.value = activeId
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeId)

    // Clear existing data
    await clearAllAccounts()
    await clearAllBookings()
    await clearAllBookingTypes()
    await clearAllStocks()
    // Import based on version
    if (backup.sm.cDBVersion === CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        await importLegacyData(backup, activeId)
    } else if (backup.sm.cDBVersion > CONS.INDEXED_DB.IMPORT_MIN_VERSION) {
        await importModernData(backup, activeId)
    } else {
        await notice(['IMPORT_DATABASE: Unsupported database version'])
        return
    }

    resetTeleport()
}

const onClickOk = async (): Promise<void> => {
    log('IMPORT_DATABASE: onClickOk')

    if (fileBlob.value.size === 0) {
        await notice(['IMPORT_DATABASE: No file selected'])
        return
    }

    await withLoading(async () => {
        try {
            const fileContent = await fileBlob.value.text()
            await processBackupFile(fileContent)
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'IMPORT_DATABASE',
                'Import failed'
            )
        }
    })
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
        <v-overlay
            v-model="isLoading"
            class="align-center justify-center"
            contained>
            <v-progress-circular
                color="primary"
                indeterminate
                size="64"
            />
        </v-overlay>
    </v-form>
</template>
