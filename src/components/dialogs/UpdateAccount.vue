<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {Ref} from 'vue'
import {defineExpose, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useDomain} from '@/composables/useDomain'
import {useFavicon} from '@/composables/useFavicon'

interface IFormData {
  swift: string
  iban: string
  logoUrl: string
  withDepot: boolean
}

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {updateAccount} = useAccountsDB()
const {ibanRules, validateForm, swiftRules} = useValidation()
const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const formData: IFormData = reactive({
  swift: '',
  iban: '',
  logoUrl: '',
  withDepot: false
})
const formRef: Ref<HTMLFormElement | null> = ref(null)
const formPreviewUrl: Ref<string> = ref('')
const formSearch: Ref<string> = ref('')

const onUpdateSwift = (swift: string): void => {
  if (!swift) return
  const clean = swift.replace(/\s/g, '').toUpperCase()
  let result: string
  if (clean.length <= 4) result = clean
  if (clean.length <= 6) result = `${clean.substring(0, 4)} ${clean.substring(4)}`
  if (clean.length <= 8) result = `${clean.substring(0, 4)} ${clean.substring(4, 6)} ${clean.substring(6)}`
  result = `${clean.substring(0, 4)} ${clean.substring(4, 6)} ${clean.substring(6, 8)} ${clean.substring(8)}`
  formData.swift = result
}

const onUpdateIban = (iban: string): void => {
  if (!iban) return
  const clean = iban.replace(/\s/g, '').toUpperCase()
  formData.iban = clean.replace(/(.{4})/g, '$1 ').trim()
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_ACCOUNT : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const account = {
      cID: settings.activeAccountId,
      cSwift: formData.swift.trim().toUpperCase(),
      cIban: formData.iban.replace(/\s/g, ''),
      cLogoUrl: formPreviewUrl.value,
      cWithDepot: formData.withDepot
    }
    records.accounts.update(account)
    await updateAccount(account)
    runtime.resetTeleport()
    await notice([t('dialogs.updateAccount.success')])
  } catch (e) {
    log('UPDATE_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.updateAccount.error')])
  }
}

const title = t('dialogs.updateAccount.title')

defineExpose({onClickOk, title})

onMounted(() => {
  log('UPDATE_ACCOUNT: onMounted')
  const accountIndex = records.accounts.getIndexById(settings.activeAccountId)
  if (accountIndex !== -1) {
    const currentAccount = records.accounts.items[accountIndex]
    Object.assign(formData, {
      swift: currentAccount.cSwift,
      iban: currentAccount.cIban,
      logoUrl: currentAccount.cLogoUrl,
      withDepot: currentAccount.cWithDepot
    })
    formPreviewUrl.value = currentAccount.cLogoUrl
  }
})

// Watch for logo search name changes with debouncing
let logoTimeout: NodeJS.Timeout
watch(formSearch, async () => {
  log('UPDATE_ACCOUNT: watch')
  if (logoTimeout !== undefined) {
    clearTimeout(logoTimeout)
  }
  logoTimeout = setTimeout(() => {
    const {domain} = useDomain(formSearch)
    const {faviconUrl} = useFavicon(domain.value ?? '')
    formPreviewUrl.value = faviconUrl.value
  }, 600)
})

log('--- UpdateAccount.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-switch
        v-model="formData.withDepot"
        :label="t('dialogs.updateAccount.withDepotLabel')"
        color="red"
        variant="outlined"/>
    <v-text-field
        v-model="formData.swift"
        :label="t('dialogs.updateAccount.swiftLabel')"
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
        @update:modelValue="onUpdateSwift"
    />
    <v-text-field
        v-model="formData.iban"
        :label="t('dialogs.updateAccount.ibanLabel')"
        :placeholder="t('dialogs.updateAccount.ibanPlaceholder')"
        :rules="ibanRules([
            t('validators.ibanRules.required'),
            t('validators.ibanRules.country'),
            t('validators.ibanRules.length'),
            t('validators.ibanRules.format'),
            t('validators.ibanRules.checksum')
        ])"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="onUpdateIban"
    />
    <v-text-field
        v-model="formSearch"
        :label="t('dialogs.updateAccount.searchLabel')"
        :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.UPDATE_ACCOUNT_URL"
        variant="outlined"
    />
  </v-form>

  <!-- Logo Preview -->
  <div class="mb-4">
    <v-avatar class="me-3" color="white" size="48">
      <v-img
          :alt="t('dialogs.updateAccount.missingLogo')"
          :src="formPreviewUrl"/>
    </v-avatar>
  </div>
  <!-- Form Summary -->
  <v-card
      v-if="formData.swift || formData.iban"
      class="pa-3 mb-4"
      variant="outlined">
    <v-card-subtitle>{{ t('dialogs.updateAccount.preview') }}</v-card-subtitle>
    <v-card-text>
      <div class="d-flex flex-column gap-2">
        <div v-if="formData.swift">
          <strong>{{ t('dialogs.updateAccount.swiftLabel') }}:</strong> {{ formData.swift }}
        </div>
        <div v-if="formData.iban">
          <strong>{{ t('dialogs.updateAccount.ibanLabel') }}:</strong> {{ formData.iban }}
        </div>
        <div>
          <strong>{{ t('dialogs.updateAccount.typeLabel') }}:</strong>
          {{
            formData.withDepot ? t('dialogs.updateAccount.withDepotLabel') : t('dialogs.updateAccount.withNoDepotLabel')
          }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
