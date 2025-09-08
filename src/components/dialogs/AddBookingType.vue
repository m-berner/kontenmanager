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
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {addBookingType} = useBookingTypesDB()
const {valNameRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()

const formularName: Ref<string> = ref('')
const isFormValid: Ref<boolean> = ref(false)

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    //TODO one message for all dialogs?
    notice([t('dialogs.addBookingType.invalidForm')])
    return false
  }

  return true
}
const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING_TYPE: onClickOk')
  if (!validateForm()) return

  try {
    const bookingType = {
      cName: formularName.value.trim(),
      cAccountNumberID: settings.activeAccountId
    }
    const addBookingTypeID = await addBookingType(bookingType)
    if (typeof addBookingTypeID === 'number') {
      const completeBookingType: IBookingType = {cID: addBookingTypeID, ...bookingType}
      records.bookingTypes.addBookingType(completeBookingType)
      await notice([t('dialogs.AddBookingType.success')])
    }
  } catch (e) {
    log('ADD_BOOKING_TYPE: onClickOk', {error: e})
    await notice([t('dialogs.addBookingType.error')])
  }
}
const title = t('dialogs.addBookingType.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING_TYPE: onMounted')
})

log('--- AddBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="form-ref"
      validate-on="submit"
      @submit.prevent>
    <v-text-field v-if="settings.activeAccountId === -1">
      {{ t('dialogs.addBookingType.message') }}
    </v-text-field>
    <v-combobox
        ref="name-input"
        v-model="formularName"
        :disabled="settings.activeAccountId === -1"
        :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
        :label="t('dialogs.addBookingType.label')"
        :menu=true
        :menu-props="{ maxHeight: 250 }"
        :rules="valNameRules([t('validators.nameRules', 0), t('validators.nameRules', 1), t('validators.nameRules', 2)])"
        max-width="300"
    />
  </v-form>
</template>
