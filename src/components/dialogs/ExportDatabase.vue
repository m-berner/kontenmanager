<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {AppError, ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {ImportExportService} from '@/services/importExport'
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from '@/types'
import {useAlertStore} from '@/stores/alerts'
import {DEFAULTS} from '@/config/defaults'
import {INDEXED_DB} from '@/config/database'

const {t} = useI18n()
const {manifest, notice, writeBufferToFile} = useBrowser()
const {getAll: getAllAccounts} = useAccountsDB()
const {getAll: getAllBookings} = useBookingsDB()
const {getAll: getAllBookingTypes} = useBookingTypesDB()
const {getAll: getAllStocks} = useStocksDB()
const {isLoading, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const {confirm} = useAlertStore()

const exportService = new ImportExportService()

const filename = computed(() => {
    const prefix = new Date().toISOString().substring(0, 10)
    return `${prefix}_${INDEXED_DB.VERSION}_${INDEXED_DB.NAME}.json`
})

const validateExportData = (
    accounts: AccountDb[],
    bookings: BookingDb[],
    stocks: StockDb[],
    bookingTypes: BookingTypeDb[]
): string[] => {
    const errors: string[] = []

    if (accounts.length === 0) {
        errors.push(t('messages.exportDatabase.noAccounts'))
    }

    // Check for data consistency
    const accountIds = new Set(accounts.map(a => a.cID))

    const invalidBookings = bookings.filter(b => !accountIds.has(b.cAccountNumberID))
    if (invalidBookings.length > 0) {
        errors.push(t('messages.exportDatabase.invalidBookings', {count: invalidBookings.length}))
    }

    const invalidStocks = stocks.filter(s => !accountIds.has(s.cAccountNumberID))
    if (invalidStocks.length > 0) {
        errors.push(t('messages.exportDatabase.invalidStocks', {count: invalidStocks.length}))
    }

    const invalidBookingTypes = bookingTypes.filter(b => !accountIds.has(b.cAccountNumberID))
    if (invalidBookingTypes.length > 0) {
        errors.push(t('messages.exportDatabase.invalidBookingTypes', {count: invalidBookingTypes.length}))
    }

    return errors
}

const createExportData = async (): Promise<string> => {
    const [accounts, bookings, stocks, bookingTypes] = await Promise.all(
        [
            getAllAccounts(),
            getAllBookings(),
            getAllStocks(),
            getAllBookingTypes()
        ]
    )

    const validationErrors = validateExportData(accounts, bookings, stocks, bookingTypes)
    if (validationErrors.length > 0) {
        throw new AppError(
            ERROR_CODES.EXPORT_DATABASE.A,
            ERROR_CATEGORY.DATABASE,
            {input: validationErrors.join('\n')},
            false
        )
    }
    const metaData = {
        cVersion: Number.parseInt(manifest.value.version.replace(/\./g, '')),
        cDBVersion: INDEXED_DB.VERSION,
        cEngine: 'indexeddb'
    }
    const dataString = exportService.stringifyDatabase(
        metaData,
        accounts,
        stocks,
        bookingTypes,
        bookings
    )
    const verification = exportService.verifyExportIntegrity(dataString)
    if (!verification.valid) {
        throw new AppError(
            ERROR_CODES.EXPORT_DATABASE.B,
            ERROR_CATEGORY.DATABASE,
            {input: verification.errors.join('\n')},
            false
        )
    }
    return `\n${dataString}`
}

const estimateExportSize = (data: string): number => {
    // Estimate size in KB
    return new TextEncoder().encode(data).length / 1024
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('EXPORT_DATABASE: onClickOk')

    await withLoading(async () => {
        try {
            const exportData = await createExportData()
            const estimatedSize = estimateExportSize(exportData)

            if (estimatedSize > DEFAULTS.LARGE_FILE_THRESHOLD_KB) {
                const proceed = await confirm(
                    t('components.dialogs.exportDatabase.largeFileTitle'),
                    t('components.dialogs.exportDatabase.messages.estimatedSize', {size: estimatedSize.toFixed(2)}),
                    {
                        confirmText: t('components.dialogs.exportDatabase.continue'),
                        cancelText: t('components.dialogs.exportDatabase.cancel'),
                        type: 'warning'
                    }
                )

                if (!proceed) {
                    return
                }
            } else {
                await notice(
                    [t('components.dialogs.exportDatabase.messages.estimatedSize', {size: estimatedSize.toFixed(2)})]
                )
            }
            await writeBufferToFile(exportData, filename.value)

            resetTeleport()
        } catch (err) {
            const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
            throw new AppError(
                ERROR_CODES.EXPORT_DATABASE.C,
                ERROR_CATEGORY.DATABASE,
                {inout: errorMessage},
                true
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.exportDatabase.title')})

UtilsService.log('--- ExportDatabase.vue setup ---')
</script>

<template>
    <v-form
        validate-on="submit"
        @submit.prevent>
        <v-card>
            <v-card-text class="pa-5">
                <v-textarea
                    :disabled="true"
                    :model-value="t('components.dialogs.exportDatabase.text', {filename})"
                    variant="outlined"/>
            </v-card-text>
        </v-card>
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
