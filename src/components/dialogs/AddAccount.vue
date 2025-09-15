<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount} from '@/types.d'
import type {Ref} from 'vue'
import {computed, defineExpose, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useFavicon} from '@/composables/useFavicon'
import {useDomain} from '@/composables/useDomain'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

interface IFormData {
  swift: string
  iban: string
  logoUrl: string
  withDepot: boolean
}

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {addAccount} = useAccountsDB()
const {ibanRules, swiftRules, validateForm} = useValidation()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

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
  log('ADD_ACCOUNT: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const account = {
      cSwift: formData.swift.trim().toUpperCase(),
      cIban: formData.iban.replace(/\s/g, ''),
      cLogoUrl: formPreviewUrl.value,
      cWithDepot: formData.withDepot
    }
    const addAccountID = await addAccount(account)
    const completeAccount: IAccount = {cID: addAccountID, ...account}
    // Update stores
    records.accounts.add(completeAccount)
    settings.activeAccountId = addAccountID
    // Persist active account ID
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)
    runtime.resetTeleport()
    await notice([t('dialogs.addAccount.success')])
  } catch (e) {
    log('ADD_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.addAccount.error')])
  }
}

const title = computed(() => t('dialogs.addAccount.title'))

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  Object.assign(formData, {
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
  })
  formPreviewUrl.value = ''
})

// Watch for logo search name changes with debouncing
let logoTimeout: NodeJS.Timeout
watch(formSearch, async () => {
  log('ADD_ACCOUNT: watch')
  if (logoTimeout !== undefined) {
    clearTimeout(logoTimeout)
  }
  logoTimeout = setTimeout(() => {
    const {domain} = useDomain(formSearch)
    const {faviconUrl} = useFavicon(domain.value ?? '')
    formPreviewUrl.value = faviconUrl.value
  }, 600)
})

log('--- AddAccount.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-switch
        v-model="formData.withDepot"
        :label="t('dialogs.addAccount.withDepotLabel')"
        color="red"
        variant="outlined"/>
    <v-text-field
        v-model="formData.swift"
        :label="t('dialogs.addAccount.swiftLabel')"
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
        @update:modelValue="onUpdateSwift"/>
    <v-text-field
        v-model="formData.iban"
        :label="t('dialogs.addAccount.ibanLabel')"
        :placeholder="t('dialogs.addAccount.ibanPlaceholder')"
        :rules="ibanRules([
            t('validators.ibanRules.required'),
            t('validators.ibanRules.country'),
            t('validators.ibanRules.length'),
            t('validators.ibanRules.format'),
            t('validators.ibanRules.checksum'),
            t('validators.ibanRules.duplicate')
        ])"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="onUpdateIban"/>
    <v-text-field
        v-model="formSearch"
        :label="t('dialogs.addAccount.searchLabel')"
        :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.ADD_ACCOUNT_URL"
        variant="outlined"/>
  </v-form>

  <!-- Logo Preview -->
  <div class="mb-4">
    <v-avatar class="me-3" color="white" size="48">
      <v-img
          :alt="t('dialogs.addAccount.missingLogo')"
          :src="formPreviewUrl"/>
    </v-avatar>
  </div>
  <!-- Form Summary -->
  <v-card
      v-if="formData.swift || formData.iban"
      class="pa-3 mb-4"
      variant="outlined">
    <v-card-subtitle>{{ t('dialogs.addAccount.preview') }}</v-card-subtitle>
    <v-card-text>
      <div class="d-flex flex-column gap-2">
        <div v-if="formData.swift">
          <strong>{{ t('dialogs.addAccount.swiftLabel') }}:</strong> {{ formData.swift }}
        </div>
        <div v-if="formData.iban">
          <strong>{{ t('dialogs.addAccount.ibanLabel') }}:</strong> {{ formData.iban }}
        </div>
        <div>
          <strong>{{ t('dialogs.addAccount.typeLabel') }}:</strong>
          {{
            formData.withDepot ? t('dialogs.addAccount.withDepotLabel') : t('dialogs.addAccount.withNoDepotLabel')
          }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
