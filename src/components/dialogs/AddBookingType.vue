<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {addBookingType} = useBookingTypesDB()
const {valNameRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()

const formularName: Ref<string> = ref('')
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (records.bookingTypes.isDuplicate(formularName.value.trim())) {
      const bookingType = {
        cName: formularName.value.trim(),
        cAccountNumberID: settings.activeAccountId
      }
      const addBookingTypeID: number = await addBookingType(bookingType)
      const completeBookingType: IBookingType = {cID: addBookingTypeID, ...bookingType}
      records.bookingTypes.addBookingType(completeBookingType)
      await notice([t('dialogs.addBookingType.success')])
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

log('--- AddBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-text-field
        v-model="formularName"
        :disabled="settings.activeAccountId === -1"
        :label="t('dialogs.addBookingType.label')"
        :rules="valNameRules(['dgdf'])"
        class="mb-4"
        required
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="() => { console.error('DFSFS') }"/>
  </v-form>
</template>
