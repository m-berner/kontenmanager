<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType} from '@/types.d'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {updateBookingType} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntime()

const formSelectedIndex = ref<number>(-1)
const formName = ref<string>('')
const formVisible = ref<boolean>(true)
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (!records.bookingTypes.isDuplicate(formName.value.trim())) {
      const bookingType: IBookingType = {
        cID: records.bookingTypes.items[formSelectedIndex.value].cID,
        cName: formName.value.trim(),
        cAccountNumberID: records.bookingTypes.items[formSelectedIndex.value].cAccountNumberID
      }
      records.bookingTypes.update(bookingType)
      await updateBookingType(bookingType)
      runtime.resetTeleport()
      await notice([t('dialogs.updateBookingType.success')])
    } else {
      await notice([t('dialogs.updateBookingType.error1a'), t('dialogs.updateBookingType.error1b')])
    }
  } catch (e) {
    log('UPDATE_BOOKING_TYPE: onClickOk', {error: e})
    await notice([t('dialogs.updateBookingType.catch')])
  }
}

const title = t('dialogs.updateBookingType.title')

defineExpose({onClickOk, title})

log('--- UpdateBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-text-field
        v-if="!formVisible"
        v-model="formName"
        :label="t('dialogs.updateBookingType.label')"
        :rules="nameRules([
            t('dialogs.validators.nameRules.required'),
            t('dialogs.validators.nameRules.length'),
            t('dialogs.validators.nameRules.begin')
        ])"
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="(mValue) => {if (mValue === null) { formSelectedIndex = 0 }}"
    />
    <v-select
        v-if="formVisible"
        v-model="formSelectedIndex"
        :items="records.bookingTypes.getNamesWithIndex"
        :label="t('dialogs.deleteBookingType.label')"
        :menu="true"
        :menu-props="{ maxHeight: '200px' }"
        density="compact"
        item-title="name"
        item-value="index"
        placeholder=""
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="formName = records.bookingTypes.items[formSelectedIndex].cName; formVisible=false"/>
  </v-form>
</template>
