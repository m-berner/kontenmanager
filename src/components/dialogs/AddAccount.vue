<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import type {IAccount} from '@/types.d'

interface IAccountData {
  swift: string
  accountNumber: string
  logoUrl: string
  stockAccount: boolean
}

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {setStorage} = useBrowser()
const {addAccount} = useIndexedDB()
const {valIbanRules, valSwiftRules, valBrandNameRules} = useValidation()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const accountData: IAccountData = reactive({
  swift: '',
  accountNumber: '',
  logoUrl: '',
  stockAccount: false
})
const isFormValid = ref(false)
const logoLoadError = ref(false)
const logoSearchName = ref('')

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
const swiftValidationRules = computed(() => valSwiftRules(validationMessages.value.swift))
const ibanValidationRules = computed(() => valIbanRules(validationMessages.value.iban))
const brandNameValidationRules = computed(() => valBrandNameRules(validationMessages.value.brandName))

// Check if account number already exists
const isAccountNumberUnique = computed(() => {
  if (!accountData.accountNumber) return true
  const cleanAccountNumber = accountData.accountNumber.replace(/\s/g, '')
  return !records.accounts.some(account => account.cNumber === cleanAccountNumber && account.cID !== 0
  )
})

// Enhanced validation rules with uniqueness check
const enhancedIbanRules = computed(() => [
  ...ibanValidationRules.value,
  () => isAccountNumberUnique.value || t('validators.accountNumberExists')
])

const resetState = (): void => {
  Object.assign(accountData, {
    swift: '',
    accountNumber: '',
    logoUrl: '',
    stockAccount: false
  })
  isFormValid.value = false
  logoLoadError.value = false
  logoSearchName.value = ''
}

const generateLogoUrl = (searchName: string): string => {
  if (!searchName?.trim()) return ''
  return `${CONS.URLS.LOGO[0]}/${searchName.trim()}/${CONS.URLS.LOGO[1]}`
}

const onInputLogoName = (): void => {
  accountData.logoUrl = generateLogoUrl(logoSearchName.value)
  logoLoadError.value = false
}

const onLogoLoadError = (): void => {
  logoLoadError.value = true
  accountData.logoUrl = CONS.URLS.NO_LOGO
}

const onLogoLoad = (): void => {
  logoLoadError.value = false
}

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

const onUpdateIbanMask = (iban: string): void => {
  accountData.accountNumber = formatIban(iban)
}

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    notice([t('dialogs.addAccount.invalidForm')])
    return false
  }

  if (!isAccountNumberUnique.value) {
    notice([t('validators.accountNumberExists')])
    return false
  }

  return true
}

const createAccountObject = (): Omit<IAccount, 'cID'> => ({
  cSwift: accountData.swift.trim().toUpperCase(),
  cNumber: accountData.accountNumber.replace(/\s/g, ''),
  cLogoUrl: accountData.logoUrl,
  cStockAccount: accountData.stockAccount
})

const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')

  if (!validateForm()) return

  try {
    const account = createAccountObject()
    const addAccountID = await addAccount(account)

    if (typeof addAccountID === 'number') {
      const completeAccount: IAccount = {cID: addAccountID, ...account}

      // Update stores
      records.addAccount(completeAccount)
      settings.setActiveAccountId(addAccountID)

      // Persist active account ID
      await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)

      await notice([t('dialogs.addAccount.success')])
      resetState()
      runtime.resetTeleport()
    } else {
      await notice(['Invalid account ID returned'])
    }
  } catch (error) {
    log('ADD_ACCOUNT: onClickOk', {error})
    await notice([t('dialogs.addAccount.error')])
  }
}

// Watch for logo search name changes with debouncing
let logoTimeout: NodeJS.Timeout
watch(() => logoSearchName.value, () => {
  clearTimeout(logoTimeout)
  logoTimeout = setTimeout(() => {
    onInputLogoName()
  }, 300)
})

const title = computed(() => t('dialogs.addAccount.title'))

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  resetState()
})

log('--- AddAccount.vue setup ---')
</script>

<template>
  <v-form
      v-model="isFormValid"
      validate-on="submit"
      class="pa-4"
  >
    <!-- Account Type Switch -->
    <v-switch
        v-model="accountData.stockAccount"
        :label="t('dialogs.addAccount.stockAccountLabel')"
        color="primary"
        class="mb-4"
    />

    <!-- SWIFT Code Field -->
    <v-text-field
        v-model="accountData.swift"
        :label="t('dialogs.addAccount.swiftLabel')"
        :rules="swiftValidationRules"
        :counter="11"
        autofocus
        required
        variant="outlined"
        class="mb-4"
        @input="accountData.swift = accountData.swift.toUpperCase()"
    />

    <!-- Account Number Field -->
    <v-text-field
        v-model="accountData.accountNumber"
        :label="t('dialogs.addAccount.accountNumberLabel')"
        :placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
        :rules="enhancedIbanRules"
        :error="!isAccountNumberUnique"
        :error-messages="!isAccountNumberUnique ? [t('validators.accountNumberExists')] : []"
        required
        variant="outlined"
        class="mb-4"
        @update:modelValue="onUpdateIbanMask"
    />

    <!-- Logo Search Name Field -->
    <v-text-field
        v-model="logoSearchName"
        :label="t('dialogs.addAccount.logoLabel')"
        :rules="brandNameValidationRules"
        placeholder="z. B. ing.com"
        required
        variant="outlined"
        class="mb-4"
    />

    <!-- Logo Preview -->
    <div class="d-flex align-center mb-4">
      <v-avatar size="48" class="me-3">
        <v-img
            v-if="accountData.logoUrl && !logoLoadError"
            :src="accountData.logoUrl"
            :alt="t('dialogs.addAccount.logoPreview')"
            @error="onLogoLoadError"
            @load="onLogoLoad"
        />
        <v-icon v-else color="grey-lighten-1">
          mdi-bank
        </v-icon>
      </v-avatar>

      <div class="text-caption">
        <div v-if="logoLoadError" class="text-warning">
          {{ t('dialogs.addAccount.logoLoadError') }}
        </div>
        <div v-else-if="accountData.logoUrl">
          {{ t('dialogs.addAccount.logoPreview') }}
        </div>
        <div v-else class="text-disabled">
          {{ t('dialogs.addAccount.noLogo') }}
        </div>
      </div>
    </div>

    <!-- Form Summary -->
    <v-card
        v-if="accountData.swift || accountData.accountNumber"
        variant="outlined"
        class="pa-3 mb-4">
      <v-card-subtitle>{{ t('dialogs.addAccount.preview') }}</v-card-subtitle>
      <v-card-text>
        <div class="d-flex flex-column gap-2">
          <div v-if="accountData.swift">
            <strong>{{ t('dialogs.addAccount.swiftLabel') }}:</strong> {{ accountData.swift }}
          </div>
          <div v-if="accountData.accountNumber">
            <strong>{{ t('dialogs.addAccount.accountNumberLabel') }}:</strong> {{ accountData.accountNumber }}
          </div>
          <div>
            <strong>{{ t('dialogs.addAccount.accountType') }}:</strong>
            {{
              accountData.stockAccount ? t('dialogs.addAccount.stockAccount') : t('dialogs.addAccount.regularAccount')
            }}
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-form>
</template>
