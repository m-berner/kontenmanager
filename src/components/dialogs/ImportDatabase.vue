<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Backup, I_Booking_DB, I_Records, I_Rollback_Data, I_Stock_DB} from '@/types'
import {computed, defineExpose, ref} from 'vue'
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
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log, isoDate} = useApp()
const {BROWSER_STORAGE, DEFAULTS, INDEXED_DB, DATE} = useAppConfig()
const {notice, setStorage} = useBrowser()
const {clear: clearAllAccounts, batchImport: importAccounts} = useAccountsDB()
const {clear: clearAllBookings, batchImport: importBookings} = useBookingsDB()
const {clear: clearAllBookingTypes, batchImport: importBookingTypes} = useBookingTypesDB()
const {clear: clearAllStocks, batchImport: importStocks} = useStocksDB()
const {isLoading, handleError, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()
const {info, confirm, error} = useAlertStore()
const {ImportExportService, readJsonFile, validateBackup} = useImportExport()
const {items: accountItems} = storeToRefs(records.accounts)

const INIT_MESSAGE = {
    title: t('components.dialogs.importDatabase.title'),
    smImportOnly: t('components.dialogs.importDatabase.messages.smImportOnly')
}

const files = ref<File[] | File | null>(null)
const fileBlob = ref<Blob>(new Blob())
const fileInputKey = ref(0)
const importService = new ImportExportService(INDEXED_DB, DATE, isoDate)

const isFileSelected = computed(() => fileBlob.value.size > 0)

const resetFileInput = () => {
    fileBlob.value = new Blob()
    files.value = null
    fileInputKey.value++ // Force component re-render
}

const validateFile = (file: File): string | null => {
    if (file.size === 0) return t('components.dialogs.importDatabase.messages.emptyFile')
    if (file.size > INDEXED_DB.MAX_FILE_SIZE) return t('components.dialogs.importDatabase.messages.fileToLarge')
    if (!file.name.endsWith('.json')) return t('components.dialogs.importDatabase.messages.invalidSuffix')
    return null
}

const onChange = (selectedFile: File | File[] | null): any => {
    if (!selectedFile) {
        fileBlob.value = new Blob()
        return
    }

    const validationError = validateFile(selectedFile as File)

    if (validationError) {
        info(t('components.dialogs.importDatabase.title'), validationError, null)
        resetFileInput()
        return
    }

    fileBlob.value = selectedFile as File
}

const createDefaultAccount = (activeId: number) => ({
    cID: activeId,
    cSwift: 'KMKLPJJ9',
    cIban: 'XX13120300001064506999',
    cLogoUrl: '',
    cWithDepot: true
})

const createDefaultBookingTypes = (activeId: number) => {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES

    const typeMapping: { cID: number, cName: string }[] = [
        {cID: BOOKING_TYPES.BUY, cName: t('components.dialogs.importDatabase.buy')},
        {cID: BOOKING_TYPES.SELL, cName: t('components.dialogs.importDatabase.sell')},
        {cID: BOOKING_TYPES.DIVIDEND, cName: t('components.dialogs.importDatabase.dividend')},
        {cID: BOOKING_TYPES.CREDIT, cName: t('components.dialogs.importDatabase.other')},
        {cID: BOOKING_TYPES.DEBIT, cName: t('components.dialogs.importDatabase.fee')},
        {cID: BOOKING_TYPES.TAX, cName: t('components.dialogs.importDatabase.tax')}
    ]

    return typeMapping.map((rec) => ({
        cID: rec.cID,
        cName: rec.cName,
        cAccountNumberID: activeId
    }))
}

const toImportRecords = <T>(data: T[]): I_Records[] =>
    data.map(rec => ({type: 'add' as const, data: rec, key: -1}))

const importInChunks = async <T>(
    items: T[],
    importFn: (_records: I_Records[]) => Promise<void>): Promise<void> => {
    for (let i = 0; i < items.length; i += INDEXED_DB.CHUNK_SIZE) {
        const chunk = items.slice(i, i + INDEXED_DB.CHUNK_SIZE)
        const records = toImportRecords(chunk)
        await importFn(records)
    }
}

const importLegacyData = async (backup: I_Backup, activeId: number): Promise<void> => {
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
    if (backup.stocks && Array.isArray(backup.stocks)) {
        for (const rec of backup.stocks) {
            const stock = importService.transformLegacyStock(rec, activeId)
            stocksImportData.push({type: 'add', data: stock, key: -1})
        }
    }

    // Transform bookings
    if (backup.transfers) {
        for (let i = 0; i < (backup.transfers?.length ?? 0); i++) {
            const booking = importService.transformLegacyBooking(backup.transfers[i], i, activeId)
            bookingsImportData.push({type: 'add', data: booking, key: -1})
        }
    }

    // Import all data with logging
    await importAccounts(accountsImportData)
    await importBookingTypes(bookingTypesImportData)
    await importStocks(stocksImportData)
    await importBookings(bookingsImportData)

    // Initialize records store
    records.init(
        {
            accountsDB: [account],
            bookingsDB: bookingsImportData.map(r => r.data as I_Booking_DB).filter(b => b.cAccountNumberID === activeId),
            bookingTypesDB: bookingTypes,
            stocksDB: stocksImportData.map(r => r.data as I_Stock_DB).filter(s => s.cAccountNumberID === activeId)
        }, INIT_MESSAGE)
}

const importModernData = async (backup: I_Backup, activeId: number): Promise<void> => {
    // Validation already done in processBackupFile, so remove duplicate check
    const safeBackup = structuredClone(backup)

    await importAccounts(toImportRecords(safeBackup.accounts))
    await importBookingTypes(toImportRecords(safeBackup.bookingTypes))
    await importStocks(toImportRecords(safeBackup.stocks))
    await importInChunks(safeBackup.bookings, importBookings)

    records.init(
        {
            accountsDB: backup.accounts,
            bookingsDB: backup.bookings.filter(rec => rec.cAccountNumberID === activeId),
            bookingTypesDB: backup.bookingTypes.filter(rec => rec.cAccountNumberID === activeId),
            stocksDB: backup.stocks.filter(rec => rec.cAccountNumberID === activeId)
        }, INIT_MESSAGE)
}

const createRollbackPoint = async (): Promise<I_Rollback_Data | null> => {
    try {
        return {
            accounts: [...records.accounts.items],
            stocks: [...records.stocks.items],
            bookingTypes: [...records.bookingTypes.items],
            bookings: [...records.bookings.items],
            activeAccountId: settings.activeAccountId
        }
    } catch (error) {
        log('IMPORT_DATABASE: Failed to create rollback point', {error})
        return null
    }
}

const restoreFromRollback = async (rollbackData: I_Rollback_Data): Promise<void> => {
    try {
        log('IMPORT_DATABASE: Starting rollback')

        await clearAllAccounts()
        await clearAllBookings()
        await clearAllBookingTypes()
        await clearAllStocks()

        await importAccounts(toImportRecords(rollbackData.accounts))
        await importBookingTypes(toImportRecords(rollbackData.bookingTypes))
        await importStocks(toImportRecords(rollbackData.stocks))
        await importBookings(toImportRecords(rollbackData.bookings))

        settings.activeAccountId = rollbackData.activeAccountId
        await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, rollbackData.activeAccountId)

        records.init(
            {
                accountsDB: rollbackData.accounts,
                bookingsDB: rollbackData.bookings,
                bookingTypesDB: rollbackData.bookingTypes,
                stocksDB: rollbackData.stocks
            }, INIT_MESSAGE)

        log('IMPORT_DATABASE: Rollback completed successfully')
    } catch (error) {
        log('IMPORT_DATABASE: CRITICAL - Rollback failed', {error})
        info(t('components.dialogs.importDatabase.title'), 'Critical error during rollback. Please refresh the page.', null)
    }
}

const getImportSummary = (backup: I_Backup): string => {
    const isLegacy = backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION

    if (isLegacy) {
        return [
            '1 account',
            `${backup.stocks?.length ?? 0} stock(s)`,
            `${backup.transfers?.length ?? 0} booking(s)`,
            '6 booking types'
        ].join('\n')
    }

    return [
        `${backup.accounts?.length ?? 0} account(s)`,
        `${backup.stocks?.length ?? 0} stock(s)`,
        `${backup.bookings?.length ?? 0} booking(s)`,
        `${backup.bookingTypes?.length ?? 0} booking type(s)`
    ].join('\n')
}

const processBackupFile = async (): Promise<void> => {
    const startTime = Date.now()
    const {activeAccountId} = storeToRefs(settings)
    const originalActiveId = activeAccountId.value

    try {
        const backup = await readJsonFile(fileBlob.value)
        const validation = validateBackup(backup)
        // Use type guard
        if (!validation.isValid) {
            info(t('components.dialogs.importDatabase.title'), validation.error || t('components.dialogs.importDatabase.invalid'), null)
            return
        }
        // Check for empty database requirement
        if (validation.version === INDEXED_DB.SM_IMPORT_VERSION && accountItems.value.length > 0) {
            info(t('components.dialogs.importDatabase.title'), t('components.dialogs.importDatabase.messages.notEmpty'), null)
            return
        }
        // Check data integrity for both legacy and modern
        let dataIntegrityErrors: string[] = []

        if (validation.version === INDEXED_DB.SM_IMPORT_VERSION) {
            dataIntegrityErrors = importService.validateLegacyDataIntegrity(backup)
        } else {
            dataIntegrityErrors = importService.validateDataIntegrity(backup)
        }

        if (dataIntegrityErrors.length > 0) {
            const errorList = dataIntegrityErrors.slice(0, 5).join('\n')
            const moreErrors = dataIntegrityErrors.length > 5
                ? `\n...and ${dataIntegrityErrors.length - 5} more`
                : ''

            error(
                t('components.dialogs.importDatabase.title'),
                t('components.dialogs.importDatabase.messages.dataIntegrity', {
                    count: dataIntegrityErrors.length,
                    errorList,
                    moreErrors
                }),
                5000
            )
            resetTeleport()
            return
        }

        // Show confirmation before import
        const summary = getImportSummary(backup)

        const shouldProceed = await confirm(
            t('components.dialogs.importDatabase.confirmImportTitle'),
            t('components.dialogs.importDatabase.messages.confirmImportWarning', {
                summary: summary.replace(/\n/g, ', ')
            }),
            {
                confirmText: t('components.dialogs.importDatabase.confirmOk'),
                cancelText: t('components.dialogs.importDatabase.confirmCancel'),
                type: 'warning'
            }
        )

        if (!shouldProceed) {
            return
        }
        // Set active account
        const activeId = backup.accounts?.[0]?.cID ?? DEFAULTS.SM_RESTORE_ACCOUNT_ID
        activeAccountId.value = activeId
        await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, activeId)
        // Clear existing data
        await clearAllAccounts()
        await clearAllBookings()
        await clearAllBookingTypes()
        await clearAllStocks()
        // Import based on version
        if (backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION) {
            await importLegacyData(backup, activeId)
        } else if (backup.sm.cDBVersion > INDEXED_DB.SM_IMPORT_VERSION) {
            await importModernData(backup, activeId)
        } else {
            info(
                t('components.dialogs.importDatabase.title'),
                t('components.dialogs.importDatabase.messages.invalidVersion'),
                4000
            )
            activeAccountId.value = originalActiveId
            await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, originalActiveId)
            return
        }
        resetTeleport()
        // At the end of processBackupFile, after successful import
        const duration = Date.now() - startTime

        await notice([t('components.dialogs.importDatabase.messages.importSucces', {
            summary: summary.replace(/\n/g, ', '),
            duration: (duration / 1000).toFixed(1)
        })])
        resetFileInput()
    } catch (err) {
        activeAccountId.value = originalActiveId
        await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, originalActiveId)
        throw handleError(
            t('components.dialogs.importDatabase.invalidJson'),
            err
        )
    }
}

const onClickOk = async (): Promise<void> => {
    log('IMPORT_DATABASE: onClickOk')

    if (!isFileSelected) {
        info(
            t('components.dialogs.importDatabase.title'),
            t('components.dialogs.importDatabase.messages.noFileSelected'),
            4000
        )
        return
    }

    await withLoading(async () => {
        const rollbackData = await createRollbackPoint()

        if (!rollbackData) {
            error(t('components.dialogs.importDatabase.title'), t('components.dialogs.importDatabase.messages.createBackupFailed'), null)
            return
        }

        try {
            await processBackupFile()
        } catch (err) {
            try {
                await restoreFromRollback(rollbackData)
                info(t('components.dialogs.importDatabase.title'),
                     t('components.dialogs.importDatabase.messages.importFailed'),
                     5000)
            } catch (rollbackErr) {
                error(t('components.dialogs.importDatabase.title'),
                      t('components.dialogs.importDatabase.messages.rollbackFailed'),
                      5000)
                log('IMPORT_DATABASE: CRITICAL - Rollback failed', {error: rollbackErr})
            }

            throw handleError(t('components.dialogs.importDatabase.messages.importFailed'), err)
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.importDatabase.title')})

log('--- ImportDatabase.vue setup ---')
</script>

<template>
    <v-form
        validate-on="submit"
        @submit.prevent>
        <v-card-text class="pa-5">
            <v-text-field
                :label="t('components.dialogs.importDatabase.messageDelete')"
                readonly
                variant="plain"
            />
            <v-file-input
                :key="fileInputKey"
                v-model="files"
                :clearable="true"
                :label="t('components.dialogs.importDatabase.fileLabel')"
                :show-size="true"
                accept=".json"
                prepend-icon="$fileUpload"
                variant="outlined"
                @update:model-value="onChange"
            />
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
