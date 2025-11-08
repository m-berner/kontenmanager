<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType_Store} from '@/types.d'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {add} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const {activeAccountId} = useSettingsStore()

const formName = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

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
        cAccountNumberID: activeAccountId
      }
      const addBookingTypeID: number = await add(bookingType)
      if (addBookingTypeID > 1) {
        const completeBookingType: IBookingType_Store = {cID: addBookingTypeID, ...bookingType}
        records.bookingTypes.add(completeBookingType)
        reset()
        await notice([t('dialogs.addBookingType.success')])
      }
    } else {
      await notice([t('dialogs.addBookingType.error1a'), t('dialogs.addBookingType.error1b')])
    }
  } catch (e) {
    log('ADD_BOOKING_TYPE: onClickOk', {error: e})
    await notice([t('dialogs.addBookingType.catch')])
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
        :label="t('dialogs.addBookingType.label')"
        :placeholder="t('dialogs.addBookingType.placeholder')"
        :rules="nameRules([
            t('dialogs.validators.nameRules.required'),
            t('dialogs.validators.nameRules.length'),
            t('dialogs.validators.nameRules.begin')
        ])"
        autofocus
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
