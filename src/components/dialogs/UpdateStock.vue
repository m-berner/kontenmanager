<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Stock_DB} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useBrowser} from '@/composables/useBrowser'
import {useStockFormular} from '@/composables/useForms'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useApp} from '@/composables/useApp'
import StockFormular from '@/components/dialogs/forms/StockFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useStocksDB()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {stockFormularData, formRef, mapStockFormToDb} = useStockFormular()
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const loadCurrentStock = (): void => {
    const currentStock = records.stocks.getItemById(activeId.value)

    Object.assign(stockFormularData, {
        id: activeId.value,
        isin: currentStock.cISIN.toUpperCase().replace(/\s/g, ''),
        company: currentStock.cCompany,
        symbol: currentStock.cSymbol,
        meetingDay: currentStock.cMeetingDay,
        quarterDay: currentStock.cQuarterDay,
        fadeOut: currentStock.cFadeOut === 1,
        firstPage: currentStock.cFirstPage === 1,
        url: currentStock.cURL,
        askDates: currentStock.cAskDates
    })
}

const onClickOk = async (): Promise<void> => {
    log('UPDATE_STOCK : onClickOk')
    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, t('components.dialogs.updateStock.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const stock: I_Stock_DB = mapStockFormToDb(activeAccountId.value)
            records.stocks.update(stock)
            await update(stock)
            await notice([t('components.dialogs.updateStock.messages.success')])
        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
    runtime.resetTeleport()
}

defineExpose({onClickOk, title: t('components.dialogs.updateStock.title')})

onBeforeMount(() => {
    log('UPDATE_STOCK_FORMULAR: onBeforeMount')
    loadCurrentStock()
})

log('--- UpdateStock.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <StockFormular :isUpdate="true"/>
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
