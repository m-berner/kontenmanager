<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useSettingsStore} from '@/stores/settings'

interface IState {
  bookingTypeName: string
}

const {t} = useI18n()
const {CONS, log, notice, valNameRules} = useApp()
const {sendMessage} = useBrowser()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()

const state: IState = reactive({
  bookingTypeName: ''
})

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING_TYPE: onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = formRef.value.validate()
  if (formIs.valid) {
    try {
      const bookingType = {
        cID: -1,
        cName: state.bookingTypeName.trim(),
        cAccountNumberID: settings.activeAccountId
      }
      records.addBookingType(bookingType)
      const addBookingTypeResponse = await sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__ADD_BOOKING_TYPE, data: bookingType
      }))
      const addBookingTypeData: IBookingType = JSON.parse(addBookingTypeResponse).data
      records.addBookingType(addBookingTypeData)
      await notice([t('dialogs.AddBookingType.success')])
      formRef.value!.reset()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.addBookingType.error')])
    }
  }
}
const title = t('dialogs.addBookingType.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING_TYPE: onMounted')
  formRef.value!.reset()
})

log('--- AddBookingType.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" @submit.prevent>
    <v-text-field v-if="settings.activeAccountId === -1">
      {{ t('dialogs.addBookingType.message') }}
    </v-text-field>
    <v-combobox
        ref="name-input"
        v-model="state.bookingTypeName"
        :disabled="settings.activeAccountId === -1"
        :item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
        :label="t('dialogs.addBookingType.label')"
        :menu=true
        :menu-props="{ maxHeight: 250 }"
        :rules="valNameRules([t('validators.nameRules', 0), t('validators.nameRules', 1), t('validators.nameRules', 2)])"
        max-width="300"
    ></v-combobox>
  </v-form>
</template>
