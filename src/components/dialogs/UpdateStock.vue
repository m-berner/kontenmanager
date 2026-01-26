<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type {FormInterface, StockDb} from '@/types'
import {onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useBrowser} from '@/composables/useBrowser'
import {useStockForm} from '@/composables/useForms'
import {useStocksDB} from '@/composables/useIndexedDB'
import {UtilsService} from '@/domains/utils'
import StockForm from '@/components/dialogs/forms/StockForm.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {databaseService} from '@/services/database'

const {t} = useI18n()
const {notice} = useBrowser()
const {update} = useStocksDB()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {activeAccountId} = useSettingsStore()
const {activeId} = storeToRefs(runtime)
const {stockFormData, mapStockFormToDb, reset: resetForm} = useStockForm()
const {isLoading, submitGuard} = useDialogGuards()
const formRef = ref<FormInterface | null>(null)

const loadCurrentStock = (): void => {
    UtilsService.log('UPDATE_STOCK: loadCurrentStock')
    resetForm()
    const currentStock = records.stocks.getById(activeId.value)

    Object.assign(stockFormData, {
        id: activeId.value,
        isin: currentStock?.cISIN.toUpperCase().replace(/\s/g, ''),
        company: currentStock?.cCompany,
        symbol: currentStock?.cSymbol,
        meetingDay: currentStock?.cMeetingDay,
        quarterDay: currentStock?.cQuarterDay,
        fadeOut: currentStock?.cFadeOut,
        firstPage: currentStock?.cFirstPage,
        url: currentStock?.cURL,
        askDates: currentStock?.cAskDates
    })
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('UPDATE_STOCK : onClickOk')

    await submitGuard(
        {
            formRef,
            isConnected: databaseService.isConnected(),
            connectionErrorMessage: t('components.dialogs.updateStock.messages.dbNotConnected'),
            notice,
            errorContext: 'UPDATE_STOCK',
            errorTitle: t('components.dialogs.onClickOk'),
            operation: async () => {
                const stock = mapStockFormToDb(activeAccountId) as StockDb
                records.stocks.update(stock)
                await update(stock as any)
                runtime.resetTeleport()
                await notice([t('components.dialogs.updateStock.messages.success')])
            }
        }
    )
}

defineExpose({onClickOk, title: t('components.dialogs.updateStock.title')})

onBeforeMount(() => {
    UtilsService.log('UPDATE_STOCK: onBeforeMount')
    loadCurrentStock()
})

UtilsService.log('--- components/dialogs/UpdateStock.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <StockForm :isUpdate="true"/>
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
