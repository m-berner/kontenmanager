<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useValidation} from '@/composables/useValidation'
import {useFavicon} from '@/composables/useFavicon'
import {useDomain} from '@/composables/useDomain'
import {useAccountFormular} from '@/composables/useAccountFormular'
import {useDebounce} from '@/composables/useDebounce'

const {t} = useI18n()
const {CONS, log} = useApp()
const {accountFormularData, formRef} = useAccountFormular()
const {ibanRules, ibanDuplicateRules, swiftRules} = useValidation()

const formSearch = ref<string>('')
const formattedIban = ref<string>('')
const formattedSwift = ref<string>('')

const joinedIbanRules = computed(() => [
  ...ibanRules([
    t('validators.ibanRules.required'),
    t('validators.ibanRules.country'),
    t('validators.ibanRules.length'),
    t('validators.ibanRules.format'),
    t('validators.ibanRules.checksum')
  ]),
  ...ibanDuplicateRules([
    t('validators.ibanRules.duplicate')
  ])
])

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

const onSearch = () => {
  const {domain} = useDomain(formSearch)
  const {faviconUrl} = useFavicon(domain.value ?? '')
  accountFormularData.logoUrl = faviconUrl.value
}
const {debouncedFunction: debouncedSearch} = useDebounce(onSearch, 500)

log('--- AccountFormular.vue setup ---')
</script>

<template>
  <v-switch
      v-model="accountFormularData.withDepot"
      :label="t('dialogs.addAccount.withDepotLabel')"
      color="red"
      variant="outlined"/>
  <v-text-field
      v-model="accountFormularData.swift"
      :counter="11"
      :label="`${t('dialogs.addAccount.swiftLabel')}${formattedSwift}`"
      :rules="swiftRules([
            t('validators.swiftRules.required'),
            t('validators.swiftRules.length'),
            t('validators.swiftRules.format'),
            t('validators.swiftRules.bankCode'),
            t('validators.swiftRules.countryCode'),
            t('validators.swiftRules.locationCode'),
            t('validators.swiftRules.branchCode'),
            t('validators.swiftRules.test'),
            t('validators.swiftRules.passive'),
        ])"
      autofocus
      variant="outlined"
      @focus="formRef?.resetValidation()"
      @update:model-value="onUpdateSwift"/>
  <v-text-field
      v-model="accountFormularData.iban"
      :label="`${t('dialogs.addAccount.ibanLabel')}${formattedIban}`"
      :placeholder="t('dialogs.addAccount.ibanPlaceholder')"
      :rules="joinedIbanRules"
      variant="outlined"
      @focus="formRef?.resetValidation()"
      @update:model-value="onUpdateIban"/>
  <v-text-field
      v-model="formSearch"
      :label="t('dialogs.addAccount.searchLabel')"
      :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL"
      variant="outlined"
      @update:model-value="debouncedSearch"/>
  <!-- Logo Preview -->
  <div class="mb-4">
    <v-avatar class="me-3" color="white" size="48">
      <v-img
          :alt="t('dialogs.addAccount.missingLogo')"
          :src="accountFormularData.logoUrl"/>
    </v-avatar>
  </div>
</template>
