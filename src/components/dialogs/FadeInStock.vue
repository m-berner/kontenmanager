<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Stock_Store} from '@/types'
import {onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useStocksDB()
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()
const runtime = useRuntimeStore()
const records = useRecordsStore()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_FADE_IN: t('messages.fadeInStock.success'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected'),
            NO_STOCK_SELECTED: t('messages.noStockSelected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.fadeInStock.title'),
            SELECT_LABEL: t('components.dialogs.fadeInStock.selectLabel')
        }
    }
)

const selected = ref<I_Stock_Store | null>(null)
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
    log('FADE_IN_STOCK: onClickOk')

    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    if (!selected.value) {
        await notice([T.MESSAGES.NO_STOCK_SELECTED])
        return
    }

    await withLoading(async () => {
        try {
            const stock = selected.value!
            stock.cFadeOut = 0

            await update(stock)
            records.stocks.update(stock)
            await notice([T.MESSAGES.SUCCESS_FADE_IN])
            runtime.resetTeleport()

        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'FADE_IN_STOCK',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
    log('FADE_IN_STOCK: onBeforeMount')
    selected.value = null
})

log('--- FadeInStock.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        v-on:submit.prevent>
        <v-card-text class="pa-5">
            <v-select
                v-model="selected"
                density="compact"
                item-key="cID"
                item-title="cCompany"
                v-bind:clearable="true"
                v-bind:items="records.stocks.passive"
                v-bind:label="T.STRINGS.SELECT_LABEL"
                v-bind:return-object="true"
                variant="outlined"/>
        </v-card-text>
        <v-overlay
            v-model="isLoading"
            contained
            class="align-center justify-center">
            <v-progress-circular
                color="primary"
                indeterminate
                size="64"
            />
        </v-overlay>
    </v-form>
</template>
