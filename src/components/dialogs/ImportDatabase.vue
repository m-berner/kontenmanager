<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type {BackupData, BookingDb, RecordOperation, RollbackData, StockDb} from '@/types'
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {AppError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import {useStorage} from '@/composables/useStorage'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {ImportExportService} from '@/services/importExport'
import {BROWSER_STORAGE} from '@/config/storage'
import {DEFAULTS} from '@/config/defaults'
import {INDEXED_DB} from '@/config/database'
import {SYSTEM} from '@/domains/config/system'
import {DomainValidators} from '@/domains/validation/validators'

const {t} = useI18n()
const {notice} = useBrowser()
const {setStorage} = useStorage()
const {atomicImport} = useAccountsDB()
const {isLoading, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()
const {info, confirm, error} = useAlertStore()
const {items: accountItems} = storeToRefs(records.accounts)

const files = ref<File[] | File | null>(null)
const fileBlob = ref<Blob>(new Blob())
const fileInputKey = ref(0)
const importService = new ImportExportService()

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

const toImportRecords = <T>(data: T[]): RecordOperation[] =>
    data.map(rec => ({type: 'add' as const, data: rec, key: -1}))

const importLegacyData = async (backup: BackupData, activeId: number): Promise<void> => {
    const accountsImportData: RecordOperation[] = []
    const bookingsImportData: RecordOperation[] = []
    const bookingTypesImportData: RecordOperation[] = []
    const stocksImportData: RecordOperation[] = []

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
            bookingsImportData.push({type: 'add', data: DomainValidators.validateBooking(booking), key: -1})
        }
    }

    // Import all data with logging
    await atomicImport([
                           {
                               storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...accountsImportData
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...bookingTypesImportData
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.STOCKS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...stocksImportData
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...bookingsImportData
                               ]
                           }
                       ])

    // Initialize records store
    records.init(
        {
            accountsDB: [account],
            bookingsDB: bookingsImportData.map(r => r.data as BookingDb).filter(b => b.cAccountNumberID === activeId),
            bookingTypesDB: bookingTypes,
            stocksDB: stocksImportData.map(r => r.data as StockDb).filter(s => s.cAccountNumberID === activeId)
        }, {title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})
}

const importModernData = async (backup: BackupData, activeId: number): Promise<void> => {
    // Validation already done in processBackupFile, so remove duplicate check
    const safeBackup = structuredClone(backup)
    safeBackup.bookings = (safeBackup.bookings || []).map(b => DomainValidators.validateBooking(b))

    await atomicImport([
                           {
                               storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...toImportRecords(safeBackup.accounts)
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...toImportRecords(safeBackup.bookingTypes)
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.STOCKS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...toImportRecords(safeBackup.stocks)
                               ]
                           },
                           {
                               storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
                               operations: [
                                   {type: 'clear'},
                                   ...toImportRecords(safeBackup.bookings)
                               ]
                           }
                       ])

    records.init(
        {
            accountsDB: safeBackup.accounts,
            bookingsDB: safeBackup.bookings.filter(rec => rec.cAccountNumberID === activeId),
            bookingTypesDB: safeBackup.bookingTypes.filter(rec => rec.cAccountNumberID === activeId),
            stocksDB: safeBackup.stocks.filter(rec => rec.cAccountNumberID === activeId)
        }, {title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})
}

const createRollbackPoint = async (): Promise<RollbackData | null> => {
    try {
        return {
            accounts: [...records.accounts.items],
            stocks: [...records.stocks.items],
            bookingTypes: [...records.bookingTypes.items],
            bookings: [...records.bookings.items],
            activeAccountId: settings.activeAccountId
        }
    } catch (err) {
        const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
        UtilsService.log('IMPORT_DATABASE: Failed to create rollback point', errorMessage)
        return null
    }
}

const restoreFromRollback = async (rollbackData: RollbackData): Promise<void> => {
    try {
        UtilsService.log('IMPORT_DATABASE: Starting rollback')

        await atomicImport([
                               {
                                   storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                                   operations: [
                                       {type: 'clear'},
                                       ...toImportRecords(rollbackData.accounts)
                                   ]
                               },
                               {
                                   storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                                   operations: [
                                       {type: 'clear'},
                                       ...toImportRecords(rollbackData.bookingTypes)
                                   ]
                               },
                               {
                                   storeName: INDEXED_DB.STORE.STOCKS.NAME,
                                   operations: [
                                       {type: 'clear'},
                                       ...toImportRecords(rollbackData.stocks)
                                   ]
                               },
                               {
                                   storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
                                   operations: [
                                       {type: 'clear'},
                                       ...toImportRecords(rollbackData.bookings)
                                   ]
                               }
                           ])

        settings.activeAccountId = rollbackData.activeAccountId
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, rollbackData.activeAccountId)

        records.init(
            {
                accountsDB: rollbackData.accounts,
                bookingsDB: rollbackData.bookings.map(b => DomainValidators.validateBooking(b)),
                bookingTypesDB: rollbackData.bookingTypes,
                stocksDB: rollbackData.stocks
            }, {title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})

        UtilsService.log('IMPORT_DATABASE: Rollback completed successfully')
    } catch (err) {
        const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
        UtilsService.log('IMPORT_DATABASE: CRITICAL - Rollback failed', errorMessage)
        info(t('components.dialogs.importDatabase.title'), 'Critical error during rollback. Please refresh the page.', null)
    }
}

const getImportSummary = (backup: BackupData): string => {
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
        const backup = await ImportExportService.readJsonFile(fileBlob.value)
        const validation = ImportExportService.validateBackup(backup)
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
                null
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
        // Set the active account
        const activeId = backup.accounts?.[0].cID ?? DEFAULTS.SM_RESTORE_ACCOUNT_ID
        activeAccountId.value = activeId
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeId)
        // Import based on the version
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
            await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId)
            return
        }
        resetTeleport()
        // At the end of the processBackupFile, after successful import
        const duration = Date.now() - startTime

        await notice([t('components.dialogs.importDatabase.messages.importSuccess', {
            summary: summary.replace(/\n/g, ', '),
            duration: (duration / 1000).toFixed(1)
        })])
        resetFileInput()
    } catch (err) {
        activeAccountId.value = originalActiveId
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId)
        const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : t('components.dialogs.importDatabase.invalidJson'))
        throw new AppError(
            errorMessage,
            'IMPORT',
            SYSTEM.ERROR_CATEGORY.DATABASE,
            {u: err},
            true
        )
    }
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('IMPORT_DATABASE: onClickOk')

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
                const rollbackErrorMessage = rollbackErr instanceof AppError ? rollbackErr.message : (rollbackErr instanceof Error ? rollbackErr.message : 'Unknown error')
                error(t('components.dialogs.importDatabase.title'),
                      t('components.dialogs.importDatabase.messages.rollbackFailed'),
                      5000)
                UtilsService.log('IMPORT_DATABASE: CRITICAL - Rollback failed', rollbackErrorMessage)
            }

            throw new AppError(
                t('components.dialogs.importDatabase.messages.importFailed'),
                'IMPORT_D',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {u: err},
                true
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.importDatabase.title')})

UtilsService.log('--- ImportDatabase.vue setup ---')
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
