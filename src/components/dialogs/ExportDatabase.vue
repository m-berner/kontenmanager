<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Account_DB, I_Booking_DB, I_Booking_Type_DB, I_Stock_DB} from '@/types'
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS, log} = useApp()
const {manifest, writeBufferToFile} = useBrowser()
const {getAll: getAllAccounts} = useAccountsDB()
const {getAll: getAllBookings} = useBookingsDB()
const {getAll: getAllBookingTypes} = useBookingTypesDB()
const {getAll: getAllStocks} = useStocksDB()

const prefix = new Date().toISOString().substring(0, 10)
const fn = `${prefix}_${CONS.INDEXED_DB.CURRENT_VERSION}_${CONS.INDEXED_DB.NAME}.json`

const T = Object.freeze(
    {
        STRINGS: {
            TITLE: t('components.dialogs.exportDatabase.title'),
            TEXT: t('components.dialogs.exportDatabase.text', {filename: fn})
        }
    }
)

const onClickOk = async (): Promise<void> => {
    log('EXPORT_DATABASE : onClickOk')
    const {resetTeleport} = useRuntimeStore()
    const accounts: I_Account_DB[] = await getAllAccounts()
    const bookings: I_Booking_DB[] = await getAllBookings()
    const stocks: I_Stock_DB[] = await getAllStocks()
    const bookingTypes: I_Booking_Type_DB[] = await getAllBookingTypes()
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
    let buffer = `{\n"sm": {"cVersion":${manifest.value.version.replace(/\./g, '')}, "cDBVersion":${CONS.INDEXED_DB.CURRENT_VERSION}, "cEngine":"indexeddb"},\n`
    buffer += stringifyDB()
    buffer += '}'
    await writeBufferToFile(buffer, fn)
    resetTeleport()
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
    </v-form>
</template>
