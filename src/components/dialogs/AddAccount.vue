<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount} from '@/types.d'
import type {Ref} from 'vue'
import {computed, defineExpose, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useFavicon} from '@/composables/useFavicon'
import {useDomain} from '@/composables/useDomain'
import {useRecordsStore} from '@/stores/records'

interface INewAccount {
  swift: string
  iban: string
  logoUrl: string
  withDepot: boolean
}

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {addAccount} = useAccountsDB()
const {ibanRules, ibanDuplicateRules, swiftRules, validateForm} = useValidation()
const {resetTeleport} = useRuntime()
const {activeAccountId} = useSettings()
const records = useRecordsStore()

const newAccount: INewAccount = reactive({
  swift: '',
  iban: '',
  logoUrl: '',
  withDepot: false
})
const formRef: Ref<HTMLFormElement | null> = ref(null)
const formPreviewUrl: Ref<string> = ref('')
const formSearch: Ref<string> = ref('')

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

const reset = (): void => {
  Object.assign(newAccount, {
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
  })
  formRef.value = null
  formPreviewUrl.value = ''
  formSearch.value = ''
}

const onUpdateSwift = (swift: string): void => {
  if (!swift) return
  const clean = swift.replace(/\s/g, '').toUpperCase()
  newAccount.swift = clean.replace(/(.{4})/g, '$1 ').trim()
}

const onUpdateIban = (iban: string): void => {
  if (!iban) return
  const clean = iban.replace(/\s/g, '').toUpperCase()
  newAccount.iban = clean.replace(/(.{4})/g, '$1 ').trim()
}

const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const account = {
      cSwift: newAccount.swift.trim().toUpperCase(),
      cIban: newAccount.iban.replace(/\s/g, ''),
      cLogoUrl: formPreviewUrl.value,
      cWithDepot: newAccount.withDepot
    }
    const addAccountID = await addAccount(account) //TODO could it be 0
    if (addAccountID > 0) {
      const completeAccount: IAccount = {cID: addAccountID, ...account}
      records.accounts.add(completeAccount)
      activeAccountId.value = addAccountID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)
      records.clean(false)
      resetTeleport()
      await notice([t('dialogs.addAccount.success')])
    }
  } catch (e) {
    log('ADD_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.addAccount.error')])
  }
}

const title = computed(() => t('dialogs.addAccount.title'))

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  reset()
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
        v-model="newAccount.withDepot"
        :label="t('dialogs.addAccount.withDepotLabel')"
        color="red"
        variant="outlined"/>
    <v-text-field
        v-model="newAccount.swift"
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
        v-model="newAccount.iban"
        :label="t('dialogs.addAccount.ibanLabel')"
        :placeholder="t('dialogs.addAccount.ibanPlaceholder')"
        :rules="joinedIbanRules"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="onUpdateIban"/>
    <v-text-field
        v-model="formSearch"
        :label="t('dialogs.addAccount.searchLabel')"
        :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.ADD_ACCOUNT_URL"
        variant="outlined"/>
    <!-- Logo Preview -->
    <div class="mb-4">
      <v-avatar class="me-3" color="white" size="48">
        <v-img
            :alt="t('dialogs.addAccount.missingLogo')"
            :src="formPreviewUrl"/>
      </v-avatar>
    </div>
  </v-form>
</template>
