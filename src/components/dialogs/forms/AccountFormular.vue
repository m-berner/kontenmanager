<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useValidation} from '@/composables/useValidation'
import {useFavicon} from '@/composables/useFavicon'
import {useDomain} from '@/composables/useDomain'
import {useAccountFormular} from '@/composables/useForms'
import {useAppConfig} from '@/composables/useAppConfig'
import type {I_Account_Formular_Props} from '@/types'

const props = defineProps<I_Account_Formular_Props>()

const {t} = useI18n()
const {log} = useApp()
const {COMPONENTS} = useAppConfig()
const {accountFormularData, formRef} = useAccountFormular()
const {ibanRules, swiftRules} = useValidation()

const SWIFT_RULES = [
    t('validators.swiftRules.required'),
    t('validators.swiftRules.length'),
    t('validators.swiftRules.format'),
    t('validators.swiftRules.bankCode'),
    t('validators.swiftRules.countryCode'),
    t('validators.swiftRules.locationCode'),
    t('validators.swiftRules.branchCode'),
    t('validators.swiftRules.test')
]
const IBAN_RULES = [
    t('validators.ibanRules.required'),
    t('validators.ibanRules.length'),
    t('validators.ibanRules.format'),
    t('validators.ibanRules.checksum'),
    t('validators.ibanRules.duplicate')
]

const formSearch = ref<string>('')
const formattedIban = ref<string>('')
const formattedSwift = ref<string>('')

const onUpdateSwift = (swift: string): void => {
    if (!swift) return
    const clean = swift.replace(/\s/g, '').toUpperCase()
    accountFormularData.swift = clean
    formattedSwift.value = accountFormularData.swift.length > 1 ? ` / ${clean.replace(/(.{4})/g, '$1 ')}` : ''
}

const onUpdateIban = (iban: string): void => {
    if (!iban) return
    const clean = iban.replace(/\s/g, '').toUpperCase()
    accountFormularData.iban = clean
    formattedIban.value = accountFormularData.iban.length > 1 ? ` / ${clean.replace(/(.{4})/g, '$1 ')}` : ''
}

const {domain} = useDomain(formSearch)

const {faviconUrl} = useFavicon(domain)

let timeoutId: ReturnType<typeof setTimeout>
watch(faviconUrl, (newUrl) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
        if (newUrl) {
            accountFormularData.logoUrl = newUrl
        }
    }, 400)
})

log('--- AccountFormular.vue setup ---')
</script>

<template>
    <v-switch
        v-model="accountFormularData.withDepot"
        :label="t('components.dialogs.forms.accountFormular.withDepotLabel')"
        color="red"
        variant="outlined"/>
    <v-text-field
        v-model="accountFormularData.swift"
        :counter="11"
        :label="`${t('components.dialogs.forms.accountFormular.swiftLabel')}${formattedSwift}`"
        :rules="swiftRules(SWIFT_RULES)"
        autofocus
        variant="outlined"
        @focus="formRef?.resetValidation?.()"
        @update:model-value="onUpdateSwift"/>
    <v-text-field
        v-if="props.isUpdate"
        v-model="accountFormularData.iban"
        :disabled="true"
        :label="`${t('components.dialogs.forms.accountFormular.ibanLabel')}${formattedIban}`"
        :placeholder="t('components.dialogs.forms.accountFormular.ibanPlaceholder')"
        :rules="ibanRules(IBAN_RULES)"
        variant="outlined"
        @focus="formRef?.resetValidation?.()"
        @update:model-value="onUpdateIban"/>
    <v-text-field
        v-else
        v-model="accountFormularData.iban"
        :label="`${t('components.dialogs.forms.accountFormular.ibanLabel')}${formattedIban}`"
        :placeholder="t('components.dialogs.forms.accountFormular.ibanPlaceholder')"
        :rules="ibanRules(IBAN_RULES)"
        variant="outlined"
        @focus="formRef?.resetValidation?.()"
        @update:model-value="onUpdateIban"/>
    <v-text-field
        v-model="formSearch"
        :label="t('components.dialogs.forms.accountFormular.searchLabel')"
        :placeholder="COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL"
        variant="outlined"
    />
    <!-- Logo Preview -->
    <div class="mb-4">
        <v-avatar class="me-3" color="white" size="48">
            <v-img
                :alt="t('components.dialogs.forms.accountFormular.missingLogo')"
                :src="accountFormularData.logoUrl"/>
        </v-avatar>
    </div>
</template>
