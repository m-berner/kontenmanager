<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useStockFormular} from '@/composables/useStockFormular'
import StockFormular from '@/components/dialogs/forms/StockFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useStocksDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()
const {stockFormularData, formRef, mapStockFormToDb} = useStockFormular()
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_ADD: t('messages.addStock.success'),
            ERROR_ADD: t('messages.addStock.error'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.addStock.title')
        }
    }
)

const formDisabled = ref<boolean>(false)

const reset = (): void => {
    Object.assign(stockFormularData, {
        isin: '',
        company: '',
        symbol: ''
    })
    formDisabled.value = false
}

const onClickOk = async (): Promise<void> => {
    log('ADD_STOCK : onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const stock = mapStockFormToDb(activeAccountId.value)
            delete stock.cID
            const addStockID = await add(stock)

            if (addStockID === -1) {
                log('ADD_STOCK: onClickOk', {error: T.MESSAGES.ERROR_ADD})
                await notice([T.MESSAGES.ERROR_ADD])
                return
            }

            stock.cID = addStockID
            records.stocks.add(stock)
            resetTeleport()
            await notice([T.MESSAGES.SUCCESS_ADD])
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'ADD_STOCK',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onMounted(() => {
    log('ADD_STOCK: onMounted')
    reset()
})

log('--- AddStock.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <StockFormular :isUpdate="false"/>
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
