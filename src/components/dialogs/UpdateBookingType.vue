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
import {useRuntimeStore} from '@/stores/runtime'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {updateBookingType} = useBookingTypesDB()
const {requiredSelect, requiredSelectNumber, validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const formSelectedIndex: Ref<number> = ref(0)
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return

  console.error(records.bookingTypes.isDuplicate(records.bookingTypes.items[formSelectedIndex.value].cName))

  try {
    if (!records.bookingTypes.isDuplicate(records.bookingTypes.items[formSelectedIndex.value].cName)) {
      const bookingType: IBookingType = { ...records.bookingTypes.items[formSelectedIndex.value] }
      records.bookingTypes.updateBookingType(bookingType)
      await updateBookingType(bookingType)
      runtime.resetTeleport()
      await notice([t('dialogs.updateBookingType.success')])
    } else {
      await notice([t('dialogs.updateBookingType.error1a'), t('dialogs.addBookingType.error1b')])
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
        v-if="formSelectedIndex > 0"
        v-model="records.bookingTypes.items[formSelectedIndex].cName"
        :label="t('dialogs.updateBookingType.label')"
        :rules="requiredSelect([t('dialogs.updateBookingType.rule1')])"
        density="compact"
        clearable
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="(mValue) => {if (mValue === null) { formSelectedIndex = 0 }}"
    />
    <v-select
        v-if="formSelectedIndex < 1"
        v-model="formSelectedIndex"
        :items="records.bookingTypes.getNamesWithIndex"
        item-title="name"
        item-value="index"
        :label="t('dialogs.deleteBookingType.label')"
        :rules="requiredSelectNumber([t('dialogs.deleteBookingType.rule1')])"
        density="compact"
        :menu="true"
        :menu-props="{ maxHeight: '200px' }"
        required
        autocomplete
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
