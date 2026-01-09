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

const selected = ref<I_Stock_Store | null>(null)
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
    log('FADE_IN_STOCK: onClickOk')

    if (!await ensureConnected(isConnected, notice, t('components.dialogs.fadeInStock.messages.dbNotConnected'))) return

    if (!selected.value) {
        await notice([t('messages.noStockSelected')])
        return
    }

    await withLoading(async () => {
        try {
            const stock = selected.value!
            stock.cFadeOut = 0

            await update(stock)
            records.stocks.update(stock)
            await notice([t('components.dialogs.fadeInStock.messages.success')])
            runtime.resetTeleport()

        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.fadeInStock.title')})

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
                v-bind:label="t('components.dialogs.fadeInStock.selectLabel')"
                v-bind:return-object="true"
                variant="outlined"/>
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
