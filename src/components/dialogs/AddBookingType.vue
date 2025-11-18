<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType_Store} from '@/types.d'
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
const {add} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)

const formName = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

const STRINGS = Object.freeze({
  TITLE: t('dialogs.addBookingType.title'),
  SUCCESS_ADD: t('dialogs.addBookingType.success.add'),
  ERROR_ADD: t('dialogs.addBookingType.errors.add'),
  BOOKING_TYPE_LABEL: t('dialogs.addBookingType.bookingTypeLabel'),
  PLACEHOLDER: t('dialogs.addBookingType.placeholder'),
  ERROR_ONCLICK_OK: t('dialogs.addBookingType.errors.onClickOk'),
  NAME_RULES: [
    t('dialogs.validators.nameRules.required'),
    t('dialogs.validators.nameRules.length'),
    t('dialogs.validators.nameRules.begin')
  ]
})

const reset = () => {
  formName.value = ''
}

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (!records.bookingTypes.isDuplicate(formName.value.trim())) {
      const bookingType = {
        cName: formName.value.trim(),
        cAccountNumberID: activeAccountId.value
      }
      const addBookingTypeID: number = await add(bookingType)
      if (addBookingTypeID > 1) {
        const completeBookingType: IBookingType_Store = {cID: addBookingTypeID, ...bookingType}
        records.bookingTypes.add(completeBookingType)
        reset()
        await notice([STRINGS.SUCCESS_ADD])
      }
    } else {
      await notice([STRINGS.ERROR_ADD])
    }
  } catch (e) {
    if (e instanceof Error) {
      log(STRINGS.ERROR_ONCLICK_OK, {error: e.message})
      await notice([STRINGS.ERROR_ONCLICK_OK, e.message])
    } else {
      throw new Error(`${STRINGS.ERROR_ONCLICK_OK}: unknown`)
    }
  }
}
const title = t('dialogs.addBookingType.title')
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
        :label="STRINGS.BOOKING_TYPE_LABEL"
        :placeholder="STRINGS.PLACEHOLDER"
        :rules="nameRules(STRINGS.NAME_RULES)"
        autofocus
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
