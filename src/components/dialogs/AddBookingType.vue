<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {addBookingType} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const {activeAccountId} = useSettings()

const formName: Ref<string> = ref('')
const formRef: Ref<HTMLFormElement | null> = ref(null)

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
      const addBookingTypeID: number = await addBookingType(bookingType) // TODO below limit 0,1,2?
      if (addBookingTypeID > 0) {
        const completeBookingType: IBookingType = {cID: addBookingTypeID, ...bookingType}
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
  <v-alert v-if="activeAccountId === -1">{{ t('dialogs.addAccount.message') }}</v-alert>
  <v-form v-else
          ref="formRef"
          validate-on="submit"
          @submit.prevent>
    <v-text-field
        v-model="formName"
        :counter="24"
        :disabled="activeAccountId === -1"
        :label="t('dialogs.addBookingType.label')"
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
