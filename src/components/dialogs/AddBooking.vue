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
import {useAppApi} from '@/pages/background'
import CurrencyInput from '@/components/helper/CurrencyInput.vue'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {notice, VALIDATORS} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()
const formRef = useTemplateRef('form-ref')
const {CONS, log} = useAppApi()

console.error(records)
const state = reactive({
  _date: '',
  _credit: 0,
  _debit: 0,
  _description: '',
  _type: ''
})

const ok = async (): Promise<void> => {
  log('ADD_BOOKING: ok')
    const formIs = await formRef.value!.validate()
    if (formIs.valid) {
      try {
        //const aNumber = records.accounts[records.getAccountIndexById(settings.activeAccountId)][CONS.DB.STORES.ACCOUNTS.FIELDS.N]
        const aDescription = state._description !== undefined && state._description !== null ? state._description.trim() : ''
        const result = await records.addBooking({
          cDate: state._date,
          // NOTE: CurrencyInput ensure 0 instead of null
          cCredit: state._credit === null ? 0 : state._credit,
          cDebit: state._debit === null ? 0 : state._debit,
          cDescription: aDescription,
          cType: state._type,
          cAccountNumberID: settings.activeAccountId
        })
        if (result === CONS.RESULTS.SUCCESS) {
          state._debit = 0
          state._credit = 0
          await notice([t('dialogs.addBooking.success')])
          formRef.value!.reset()
        }
      } catch (e) {
        console.error(e)
        await notice([t('dialogs.addBooking.error')])
      }
    }
}
const title = t('dialogs.addBooking.title')

defineExpose({ok, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
  formRef.value!.reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-text-field v-if="settings.activeAccountId === -1">
      {{ t('dialogs.addBookingType.message') }}
    </v-text-field>
    <v-text-field
      ref="date-input"
      v-model="state._date"
      autofocus
      density="compact"
      required
      type="date"
      v-bind:label="t('dialogs.addBooking.dateLabel')"
      v-bind:rules="VALIDATORS.dateRules([t('validators.dateRules', 0)])"
      variant="outlined"
      v-on:focus="formRef?.resetValidation"
    ></v-text-field>
    <CurrencyInput
      v-model="state._credit"
      v-bind:label="t('dialogs.addBooking.creditLabel')"
      v-bind:options="{ currency: 'EUR' }"
    ></CurrencyInput>
    <CurrencyInput
      v-model="state._debit"
      v-bind:label="t('dialogs.addBooking.debitLabel')"
      v-bind:options="{ currency: 'EUR' }"
    ></CurrencyInput>
    <v-text-field
      v-model="state._description"
      density="compact"
      required
      v-bind:label="t('dialogs.addBooking.descriptionLabel')"
      variant="outlined"
    ></v-text-field>
    <v-select
      ref="type-input"
      v-model="state._type"
      density="compact"
      max-width="300"
      v-bind:item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
      v-bind:item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
      v-bind:items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
      v-bind:label="t('dialogs.addBooking.typeLabel')"
      v-bind:menu=false
      v-bind:menu-props="{ maxHeight: 250 }"
      v-bind:rules="VALIDATORS.requiredRule([t('validators.requiredRule', 0)])"
      variant="outlined"
    ></v-select>
  </v-form>
</template>
