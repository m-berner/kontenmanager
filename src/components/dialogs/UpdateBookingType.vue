<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType_Store} from '@/types.d'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {update} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const STRINGS = Object.freeze({
  TITLE: t('dialogs.updateBookingType.title'),
  SUCCESS_ADD: t('dialogs.updateBookingType.success.add'),
  ERROR_ADD: t('dialogs.updateBookingType.errors.add'),
  ERROR_ONCLICK_OK: t('dialogs.updateBookingType.errors.onClickOk'),
  BOOKING_TYPE_LABEL: t('dialogs.updateBookingType.bookingTypeLabel'),
  NAME_RULES:[
    t('dialogs.validators.nameRules.required'),
    t('dialogs.validators.nameRules.length'),
    t('dialogs.validators.nameRules.begin')
  ]
})

const formSelectedIndex = ref()
const formName = ref<string>('')
const formVisible = ref<boolean>(true)
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING_TYPE: onClickOk')
  const {items: bookingTypeItems} = storeToRefs(records.bookingTypes)
  if (!await validateForm(formRef)) return

  try {
    if (!records.bookingTypes.isDuplicate(formName.value.trim())) {
      const bookingType: IBookingType_Store = {
        cID: bookingTypeItems.value[formSelectedIndex.value].cID,
        cName: formName.value.trim(),
        cAccountNumberID: bookingTypeItems.value[formSelectedIndex.value].cAccountNumberID
      }
      records.bookingTypes.update(bookingType)
      await update(bookingType)
      runtime.resetTeleport()
      await notice([STRINGS.SUCCESS_ADD])
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
const title = STRINGS.TITLE
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
        :label="STRINGS.BOOKING_TYPE_LABEL"
        :rules="nameRules(STRINGS.NAME_RULES)"
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="(mValue) => {if (mValue === null) { formSelectedIndex = 0 }}"
    />
    <v-select
        v-if="formVisible"
        v-model="formSelectedIndex"
        :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.items"
        :label="t('dialogs.deleteBookingType.label')"
        :menu="true"
        :menu-props="{ maxHeight: '200px' }"
        density="compact"
        placeholder=""
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="formName = records.bookingTypes.items[formSelectedIndex].cName; formVisible=false"/>
  </v-form>
</template>
