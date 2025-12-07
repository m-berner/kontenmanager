<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType_Store} from '@/types'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)

const formName = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_ADD: t('messages.addBookingType.success'),
    ERROR_ADD: t('messages.addBookingType.error'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('dialogs.addBookingType.title'),
    BOOKING_TYPE_LABEL: t('dialogs.addBookingType.bookingTypeLabel'),
    PLACEHOLDER: t('dialogs.addBookingType.placeholder')
  },
  NAME_RULES: [
    t('validators.nameRules.required'),
    t('validators.nameRules.length'),
    t('validators.nameRules.begin')
  ]
})

const reset = () => {
  formName.value = ''
}

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    if (!records.bookingTypes.isDuplicate(formName.value.trim())) {
      const bookingType = {
        cName: formName.value.trim(),
        cAccountNumberID: activeAccountId.value
      }
      const addBookingTypeID: number = await add(bookingType)
      if (addBookingTypeID === -1) {
        log('ADD_BOOKING_TYPE: onClickOk', {error: T.MESSAGES.ERROR_ADD})
        await notice([T.MESSAGES.ERROR_ADD])
      }
      const completeBookingType: IBookingType_Store = {cID: addBookingTypeID, ...bookingType}
      records.bookingTypes.add(completeBookingType)
      reset()
      await notice([T.MESSAGES.SUCCESS_ADD])
    } else {
      await notice([T.MESSAGES.ERROR_ADD])
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    log(T.MESSAGES.ERROR_ONCLICK_OK, {error: errorMessage})
    await notice([T.MESSAGES.ERROR_ONCLICK_OK, errorMessage])
  }
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING_TYPE: onMounted')
  reset()
})

log('--- AddBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-text-field
        v-model="formName"
        :counter="32"
        :disabled="activeAccountId === -1"
        :label="T.STRINGS.BOOKING_TYPE_LABEL"
        :placeholder="T.STRINGS.PLACEHOLDER"
        :rules="nameRules(T.NAME_RULES)"
        autofocus
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
