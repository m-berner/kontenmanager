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
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {updateBookingType} = useBookingTypesDB()
const {requiredSelect, valNameRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()

const formularSelected: Ref<number> = ref(0)
const formularName: Ref<string> = ref('')
const formRef: Ref<HTMLFormElement | null> = ref(null)

const getSelectedText = (): string => {
  const selected = records.bookingTypes.items.find(item => item.cID === formularSelected.value)
  return selected ? selected.cName : ''
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING_TYPE: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (records.bookingTypes.isDuplicate(formularName.value.trim()) < 0) {
      const bookingType: IBookingType = {
        cID: formularSelected.value,
        cName: formularName.value.trim(),
        cAccountNumberID: settings.activeAccountId
      }
      records.bookingTypes.updateBookingType(bookingType)
      await updateBookingType(bookingType)
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

onMounted(() => {
  log('UPDATE_BOOKING_TYPE: onMounted')
})

log('--- UpdateBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-select
        v-model="formularSelected"
        :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.items"
        :label="t('dialogs.updateBookingType.label')"
        :rules="requiredSelect([t('dialogs.updateBookingType.rule1')])"
        density="compact"
        required
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="() => { formularName = getSelectedText() }"/>
    <v-text-field
        v-model="formularName"
        :label="t('dialogs.updateBookingType.label')"
        :rules="valNameRules(['dgdf'])"
        :disabled="settings.activeAccountId === -1"
        class="mb-4"
        required
        variant="outlined"
        @focus="formRef?.resetValidation()"
        @update:modelValue="() => { console.error('TXT-DFSFS') }"/>
  </v-form>
</template>
