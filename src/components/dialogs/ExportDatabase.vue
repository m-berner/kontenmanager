<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useImportExport} from '@/composables/useImportExport'

const {t} = useI18n()
const {CONS, isoDate, log} = useApp()
const {manifest, writeBufferToFile} = useBrowser()
const {getAll: getAllAccounts} = useAccountsDB()
const {getAll: getAllBookings} = useBookingsDB()
const {getAll: getAllBookingTypes} = useBookingTypesDB()
const {getAll: getAllStocks} = useStocksDB()
const {isLoading, handleError, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const {ImportExportService} = useImportExport()

const exportService = new ImportExportService(CONS, isoDate)

const prefix = new Date().toISOString().substring(0, 10)
const filename = `${prefix}_${CONS.INDEXED_DB.CURRENT_VERSION}_${CONS.INDEXED_DB.NAME}.json`

const T = Object.freeze(
    {
        MESSAGES: {
            ERROR_EXPORT: t('messages.exportDatabase.error')
        },
        STRINGS: {
            TITLE: t('components.dialogs.exportDatabase.title'),
            TEXT: t('components.dialogs.exportDatabase.text', {filename})
        }
    }
)

const createExportData = async (): Promise<string> => {
    const [accounts, bookings, stocks, bookingTypes] = await Promise.all(
        [
            getAllAccounts(),
            getAllBookings(),
            getAllStocks(),
            getAllBookingTypes()
        ]
    )
    const metadata = {
        cVersion: parseInt(manifest.value.version.replace(/./g, '')),
        cDBVersion: CONS.INDEXED_DB.CURRENT_VERSION,
        cEngine: 'indexeddb'
    }
    const dataString = exportService.stringifyDatabase(
        accounts,
        stocks,
        bookingTypes,
        bookings
    )
    return `{\n"sm": ${JSON.stringify(metadata)},\n${dataString}}`
}

const onClickOk = async (): Promise<void> => {
    log('EXPORT_DATABASE: onClickOk')
    await withLoading(async () => {
        try {
            const exportData = await createExportData()
            await writeBufferToFile(exportData, filename)
            resetTeleport()
        } catch (error) {
            await handleError(
                error,
                log,
                async (msg) => {
                    // eslint-disable-next-line no-console
                    console.error(msg)
                },
                'EXPORT_DATABASE',
                T.MESSAGES.ERROR_EXPORT
            )
        }
    })
}

const title = T.STRINGS.TITLE
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
                    :model-value="T.STRINGS.TEXT"
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
