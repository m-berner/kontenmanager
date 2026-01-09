<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineProps} from 'vue'
import {useI18n} from 'vue-i18n'
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import {useStockFormular} from '@/composables/useStockFormular'
import {useFetch} from '@/composables/useFetch'
import type {I_Stock_Formular_Props} from '@/types'
import {useDialogGuards} from '@/composables/useDialogGuards'

const props = defineProps<I_Stock_Formular_Props>()

const {t} = useI18n()
const {log} = useApp()
const {handleError} = useDialogGuards()
const {isinRules} = useValidation()
const {fetchCompanyData} = useFetch()
const {stockFormularData, formRef} = useStockFormular()

const ISIN_RULES = [
    t('validators.isinRules.required'),
    t('validators.isinRules.length'),
    t('validators.isinRules.format'),
    t('validators.isinRules.country'),
    t('validators.isinRules.luhn')
]

const onUpdateIsin = async () => {
    log('STOCK_FORMULAR: onUpdateISIN')
    try {
        if (!props.isUpdate && stockFormularData.isin.length === 12) {
            stockFormularData.isin = stockFormularData.isin.toUpperCase().replace(/\s/g, '')
            const companyData = await fetchCompanyData(stockFormularData.isin)
            stockFormularData.company = companyData.company
            stockFormularData.symbol = companyData.symbol
        }
    } catch (err) {
        stockFormularData.company = ''
        stockFormularData.symbol = ''
        throw handleError(
            t('components.dialogs.forms.stockFormular.messages.onUpdateIsin'),
            err
        )
    }
}

log('--- StockFormular.vue setup ---')
</script>

<template>
    <v-container>
        <v-row>
            <v-text-field
                v-model="stockFormularData.isin"
                :counter="12"
                :label="t('components.dialogs.forms.stockFormular.isinLabel')"
                :rules="isinRules(ISIN_RULES)"
                autofocus
                variant="outlined"
                @focus="formRef?.resetValidation?.()"
                @update:model-value="onUpdateIsin"/>
        </v-row>
        <v-row>
            <v-text-field
                v-model="stockFormularData.company"
                :label="t('components.dialogs.forms.stockFormular.companyLabel')"
                required
                variant="outlined"
                @focus="formRef?.resetValidation?.()"
            />
        </v-row>
        <v-row cols="2" sm="2">
            <v-col/>
            <v-col>
                <v-text-field
                    v-model="stockFormularData.symbol"
                    :label="t('components.dialogs.forms.stockFormular.symbolLabel')"
                    required
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
    </v-container>
    <v-container v-if="props.isUpdate">
        <v-row cols="2" sm="2">
            <v-col>
                <v-text-field
                    v-model="stockFormularData.meetingDay"
                    :label="t('components.dialogs.forms.stockFormular.meetingDayLabel')"
                    type="date"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
            <v-col>
                <v-text-field
                    v-model="stockFormularData.quarterDay"
                    :label="t('components.dialogs.forms.stockFormular.quarterDayLabel')"
                    type="date"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
        <v-row cols="2" sm="2">
            <v-col>
                <v-checkbox
                    v-model="stockFormularData.fadeOut"
                    :label="t('components.dialogs.forms.stockFormular.fadeOutLabel')"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
            <v-col>
                <v-checkbox
                    v-model="stockFormularData.firstPage"
                    :label="t('components.dialogs.forms.stockFormular.firstPageLabel')"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
        <v-row>
            <v-text-field
                v-model="stockFormularData.url"
                :label="t('components.dialogs.forms.stockFormular.urlLabel')"
                variant="outlined"
                @focus="formRef?.resetValidation?.()"
            />
        </v-row>
    </v-container>
</template>
