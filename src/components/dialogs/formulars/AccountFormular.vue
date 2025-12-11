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
import {useAccountFormular} from '@/composables/useAccountFormular'

const {t} = useI18n()
const {CONS, log} = useApp()
const {accountFormularData, formRef} = useAccountFormular()
const {ibanRules, swiftRules} = useValidation()

const T = Object.freeze({
                            STRINGS: {
                                WITH_DEPOT_LABEL: t('components.dialogs.formulars.accountFormular.withDepotLabel'),
                                SWIFT_LABEL: t('components.dialogs.formulars.accountFormular.swiftLabel'),
                                IBAN_LABEL: t('components.dialogs.formulars.accountFormular.ibanLabel'),
                                IBAN_PLACEHOLDER: t('components.dialogs.formulars.accountFormular.ibanPlaceholder'),
                                SEARCH_LABEL: t('components.dialogs.formulars.accountFormular.searchLabel'),
                                MISSING_LOGO_LABEL: t('components.dialogs.formulars.accountFormular.missingLogo')
                            },
                            SWIFT_RULES: [
                                t('validators.swiftRules.required'),
                                t('validators.swiftRules.length'),
                                t('validators.swiftRules.format'),
                                t('validators.swiftRules.bankCode'),
                                t('validators.swiftRules.countryCode'),
                                t('validators.swiftRules.locationCode'),
                                t('validators.swiftRules.branchCode'),
                                t('validators.swiftRules.test'),
                                t('validators.swiftRules.passive')
                            ],
                            IBAN_RULES: [
                                t('validators.ibanRules.required'),
                                t('validators.ibanRules.country'),
                                t('validators.ibanRules.length'),
                                t('validators.ibanRules.format'),
                                t('validators.ibanRules.checksum'),
                                t('validators.ibanRules.duplicate')
                            ]
                        })

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
        :label="T.STRINGS.WITH_DEPOT_LABEL"
        color="red"
        variant="outlined"/>
    <v-text-field
        v-model="accountFormularData.swift"
        :counter="11"
        :label="`${T.STRINGS.SWIFT_LABEL}${formattedSwift}`"
        :rules="swiftRules(T.SWIFT_RULES)"
        autofocus
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:model-value="onUpdateSwift"/>
    <v-text-field
        v-model="accountFormularData.iban"
        :label="`${T.STRINGS.IBAN_LABEL}${formattedIban}`"
        :placeholder="T.STRINGS.IBAN_PLACEHOLDER"
        :rules="ibanRules(T.IBAN_RULES)"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:model-value="onUpdateIban"/>
    <v-text-field
        v-model="formSearch"
        :label="T.STRINGS.SEARCH_LABEL"
        :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL"
        variant="outlined"
    />
    <!-- Logo Preview -->
    <div class="mb-4">
        <v-avatar class="me-3" color="white" size="48">
            <v-img
                :alt="T.STRINGS.MISSING_LOGO_LABEL"
                :src="accountFormularData.logoUrl"/>
        </v-avatar>
    </div>
</template>
