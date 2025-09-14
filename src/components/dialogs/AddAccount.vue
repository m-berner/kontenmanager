<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount} from '@/types.d'
import type {Reactive, Ref} from 'vue'
import {computed, defineExpose, onMounted, reactive, ref, toRefs, watch} from 'vue'
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

interface IFormularData {
  swift: string
  iban: string
  url: string
  withDepot: boolean
}

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {addAccount} = useAccountsDB()
const {ibanRules, swiftRules} = useValidation()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const formularData: Reactive<IFormularData> = reactive({
  swift: '',
  iban: '',
  url: '',
  withDepot: false
})
const isFormValid: Ref<boolean> = ref(false)
const domainName: Ref<string | null> = ref('')

// Computed properties for validation messages
const validationMessages = computed(() => ({
  swift: [
    t('validators.swiftRules', 0),
    t('validators.swiftRules', 1),
    t('validators.swiftRules', 2)
  ],
  iban: [
    t('validators.ibanRules', 0),
    t('validators.ibanRules', 1),
    t('validators.ibanRules', 2)
  ],
  brandName: [t('validators.brandNameRules', 0)]
}))

// Computed validation rules
const swiftValidationRules = computed(() => swiftRules(validationMessages.value.swift))
//const ibanValidationRules = computed(() => ibanRules(validationMessages.value.iban))

// Check if account iban already exists
const isAccountNumberUnique = computed(() => {
  if (!formularData.iban) return true
  const cleanAccountNumber = formularData.iban.replace(/\s/g, '')
  return !records.accounts.items.some(account => account.cIban === cleanAccountNumber && account.cID !== 0
  )
})

// Enhanced validation rules with uniqueness check
// const enhancedIbanRules = computed(() => [
//   ...ibanValidationRules.value,
//   () => isAccountNumberUnique.value || t('validators.numberExists')
// ])

const reset = (): void => {
  Object.assign(formularData, {
    swift: '',
    number: '',
    url: '',
    withDepot: false
  })
  isFormValid.value = false
}

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    notice([t('dialogs.addAccount.invalidForm')])
    return false
  }

  if (!isAccountNumberUnique.value) {
    notice([t('validators.numberExists')])
    return false
  }

  return true
}

const createAccountObject = (): Omit<IAccount, 'cID'> => ({
  cSwift: formularData.swift.trim().toUpperCase(),
  cIban: formularData.iban.replace(/\s/g, ''),
  cLogoUrl: formularData.url,
  cWithDepot: formularData.withDepot
})

const formatIban = (iban: string): string => {
  if (!iban) return ''

  const withoutSpace = iban.replace(/\s/g, '')
  const loops = Math.ceil(withoutSpace.length / 4)
  let masked = ''

  for (let i = 0; i < loops; i++) {
    const chunk = withoutSpace.slice(i * 4, (i + 1) * 4)
    if (i === 0) {
      masked = chunk.toUpperCase()
    } else {
      masked += ` ${chunk}`
    }
  }

  return masked
}

const logoUrl: Ref<string> = ref('')
const onInputUrl = (): string => {
  log('ADD_ACCOUNT: onInputLogoName')
  const {url} = toRefs(formularData)
  const {domain} = useDomain(url)
  domainName.value = domain.value
  const {faviconUrl} = useFavicon(domainName.value ?? '')
  return faviconUrl.value
}

const onUpdateIbanMask = (iban: string): void => {
  formularData.iban = formatIban(iban)
}

const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')
  if (!validateForm()) return

  try {
    const account = createAccountObject()
    const addAccountID = await addAccount(account)

    if (addAccountID > 0) {
      const completeAccount: IAccount = {cID: addAccountID, ...account}

      // Update stores
      records.accounts.add(completeAccount)
      settings.activeAccountId = (addAccountID)

      // Persist active account ID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)

      await notice([t('dialogs.addAccount.success')])
      reset()
      runtime.resetTeleport()
    } else {
      await notice(['Invalid account ID returned'])
    }
  } catch (error) {
    log('ADD_ACCOUNT: onClickOk', {error})
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
watch(() => formularData.url, async () => {
  if (logoTimeout !== undefined) {
    clearTimeout(logoTimeout)
  }
  logoTimeout = setTimeout(() => {
    logoUrl.value = onInputUrl()
  }, 600)
})

log('--- AddAccount.vue setup ---')
</script>

<template>
  <v-form
      v-model="isFormValid"
      class="pa-4"
      validate-on="submit"
      @submit.prevent>
    <!-- Account Type Switch -->
    <v-switch
        v-model="formularData.withDepot"
        :label="t('dialogs.addAccount.withDepotLabel')"
        class="mb-4"
        color="primary"/>

    <!-- SWIFT Code Field -->
    <v-text-field
        v-model="formularData.swift"
        :counter="11"
        :label="t('dialogs.addAccount.swiftLabel')"
        :rules="swiftValidationRules"
        autofocus
        class="mb-4"
        variant="outlined"
        @input="formularData.swift = formularData.swift.toUpperCase()"/>

    <!-- Account Number Field -->
    <v-text-field
        v-model="formularData.iban"
        :error="!isAccountNumberUnique"
        :error-messages="!isAccountNumberUnique ? [t('validators.numberExists')] : []"
        :label="t('dialogs.addAccount.numberLabel')"
        :placeholder="t('dialogs.addAccount.numberPlaceholder')"
        :rules="ibanRules([])"
        class="mb-4"
        variant="outlined"
        @update:modelValue="onUpdateIbanMask"/>

    <!-- Account Url Field -->
    <v-text-field
        v-model="formularData.url"
        :label="t('dialogs.addAccount.urlLabel')"
        :placeholder="CONS.COMPONENTS.DIALOGS.PLACEHOLDER.ADD_ACCOUNT_URL"
        class="mb-4"
        variant="outlined"/>

    <!-- Logo Preview -->
    <div class="d-flex align-center mb-4">
      <v-avatar class="me-3" color="white" size="48">
        <v-img
            :alt="t('dialogs.addAccount.logoPreview')"
            :src="logoUrl"/>
      </v-avatar>

      <div class="text-caption">
        <div>
          {{ t('dialogs.addAccount.logoPreview') }}
        </div>
      </div>
    </div>

    <!-- Form Summary aktien konto ja/nein, logoUrl -->
    <v-card
        v-if="formularData.swift || formularData.iban"
        class="pa-3 mb-4"
        variant="outlined">
      <v-card-subtitle>{{ t('dialogs.addAccount.preview') }}</v-card-subtitle>
      <v-card-text>
        <div class="d-flex flex-column gap-2">
          <div v-if="formularData.swift">
            <strong>{{ t('dialogs.addAccount.swiftLabel') }}:</strong> {{ formularData.swift }}
          </div>
          <div v-if="formularData.iban">
            <strong>{{ t('dialogs.addAccount.numberLabel') }}:</strong> {{ formularData.iban }}
          </div>
          <div v-if="formularData.url">
            <strong>{{ t('dialogs.addAccount.urlLabel') }}:</strong> {{ formularData.url }}
          </div>
          <div>
            <strong>{{ t('dialogs.addAccount.accountTypeLabel') }}:</strong>
            {{
              formularData.withDepot ? t('dialogs.addAccount.withDepot') : t('dialogs.addAccount.regularAccount')
            }}
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-form>
</template>
