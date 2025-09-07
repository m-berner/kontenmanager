<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking, IBookingType, IStock} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import CurrencyInput from '@/components/dialogs/childs/CurrencyInput.vue'

interface IFormularData {
  bookDate: string
  exDate: string
  credit: number
  debit: number
  description: string
  count: number
  unitQuotation: number
  bookingTypeId: number
  accountTypeId: number
  stockId: number
  sourceTax: number
  transactionTax: number
  tax: number
  fee: number
  soli: number
  marketPlace: string
}

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {addBooking} = useBookingsDB()
const {valRequiredRules, valDateRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()

const formularData: IFormularData = reactive({
  bookDate: '',
  exDate: '',
  credit: 0,
  debit: 0,
  description: '',
  count: 0,
  unitQuotation: 0,
  bookingTypeId: 0,
  accountTypeId: 0,
  stockId: 0,
  sourceTax: 0,
  transactionTax: 0,
  tax: 0,
  fee: 0,
  soli: 0,
  marketPlace: ''
})
const isFormValid: Ref<boolean> = ref(false)

const reset = (): void => {
  Object.assign(formularData, {
    bookDate: '',
    exDate: '',
    description: '',
    debit: 0,
    credit: 0,
    count: 0,
    unitQuotation: 0,
    bookingTypeId: 0,
    accountTypeId: -1,
    stockId: 0,
    soli: 0,
    tax: 0,
    fee: 0,
    sourceTax: 0,
    transactionTax: 0
  })
  isFormValid.value = false
}

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    notice([t('dialogs.addBooking.invalidForm')])
    return false
  }

  return true
}

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING : onClickOk')
  if (!validateForm()) return

  let booking: Omit<IBooking, 'cID'>
  let costs: number = 0
  let result: number = 0

  try {
    costs = formularData.soli + formularData.transactionTax + formularData.tax + formularData.fee + formularData.sourceTax
    switch (formularData.bookingTypeId) {
      case 1:
        result = formularData.count * formularData.unitQuotation + costs
        booking = {
          cDate: formularData.bookDate,
          cCredit: result < 0 ? -result : 0,
          cDebit: result > 0 ? result : 0,
          cDescription: formularData.description,
          cBookingTypeID: formularData.bookingTypeId,
          cStockID: formularData.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: formularData.count,
          cSoli: formularData.soli,
          cTax: formularData.tax,
          cFee: formularData.fee,
          cSourceTax: formularData.sourceTax,
          cTransactionTax: formularData.transactionTax,
          cMarketPlace: formularData.marketPlace
        }
        break
      case 2:
        result = formularData.count * formularData.unitQuotation - costs
        booking = {
          cDate: formularData.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: formularData.description,
          cBookingTypeID: formularData.bookingTypeId,
          cStockID: formularData.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: formularData.count,
          cSoli: formularData.soli,
          cTax: formularData.tax,
          cFee: formularData.fee,
          cSourceTax: formularData.sourceTax,
          cTransactionTax: formularData.transactionTax,
          cMarketPlace: formularData.marketPlace
        }
        break
      case 3:
        result = formularData.count * formularData.unitQuotation - costs
        booking = {
          cDate: formularData.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: formularData.description,
          cBookingTypeID: formularData.bookingTypeId,
          cStockID: formularData.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: formularData.exDate,
          cCount: formularData.count,
          cSoli: formularData.soli,
          cTax: formularData.tax,
          cFee: formularData.fee,
          cSourceTax: formularData.sourceTax,
          cTransactionTax: formularData.transactionTax,
          cMarketPlace: ''
        }
        break
      default:
        booking = {
          cDate: formularData.bookDate,
          cCredit: formularData.credit,
          cDebit: formularData.debit,
          cDescription: formularData.description,
          cBookingTypeID: formularData.bookingTypeId,
          cStockID: 0,
          cAccountNumberID: settings.activeAccountId,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: 0,
          cSoli: 0,
          cTax: 0,
          cFee: 0,
          cSourceTax: 0,
          cTransactionTax: 0,
          cMarketPlace: ''
        }
    }
    const addBookingID = await addBooking(booking)
    if (typeof addBookingID === 'number') {
      const completeBooking: IBooking = {cID: addBookingID, ...booking}
      records.bookings.addBooking(completeBooking)
      await notice([t('dialogs.AddBooking.success')])
      reset()
    }
  } catch (e) {
    log('ADD_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.addBooking.error')])
  }
}

const title = t('dialogs.addBooking.title')

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
  reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-form
      v-model="isFormValid"
      validate-on="submit"
      @submit.prevent>
    <v-container>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field v-if="settings.activeAccountId === -1">
            {{ t('dialogs.addBookingType.message') }}
          </v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-text-field
              ref="date-input"
              v-model="formularData.bookDate"
              :label="t('dialogs.addBooking.dateLabel')"
              :rules="valDateRules([t('validators.dateRules', 0)])"
              autofocus
              density="compact"
              required
              type="date"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-select
              v-model="formularData.bookingTypeId"
              :itemTitle="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
              :itemValue="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
              :items="records.bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
              :label="t('dialogs.addBooking.bookingTypeLabel')"
              :menu=false
              :menuProps="{ maxHeight: 250 }"
              :rules="valRequiredRules([t('validators.requiredRule', 0)])"
              density="compact"
              max-width="300"
              required
              variant="outlined"
              @update:modelValue="(ev) => {console.error('CHANGE', ev)}"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="formularData.bookingTypeId < 4 && formularData.bookingTypeId > 0"
              v-model="formularData.count"
              :label="t('dialogs.addBooking.countLabel')"
              class="withoutSpinner"
              density="compact"
              type="number"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="formularData.bookingTypeId < 4 && formularData.bookingTypeId > 0"
              v-model="formularData.unitQuotation"
              :label="t('dialogs.addBooking.unitQuotationLabel')"
              @amount="(a) => { formularData.unitQuotation = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="formularData.bookingTypeId > 3"
              v-model="formularData.credit"
              :label="t('dialogs.addBooking.creditLabel')"
              @amount="(a) => { formularData.credit = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="formularData.bookingTypeId > 3"
              v-model="formularData.debit"
              :label="t('dialogs.addBooking.debitLabel')"
              @amount="(a) => { formularData.debit = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="formularData.bookingTypeId < 4 && formularData.bookingTypeId > 1"
              v-model="formularData.tax"
              :label="t('dialogs.addBooking.taxLabel')"
              @amount="(a) => { formularData.tax = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="formularData.bookingTypeId < 4 && formularData.bookingTypeId > 1"
              v-model="formularData.soli"
              :label="t('dialogs.addBooking.soliLabel')"
              @amount="(a) => { formularData.soli = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="formularData.bookingTypeId === 3"
              ref="date-input"
              v-model="formularData.exDate"
              :label="t('dialogs.addBooking.exDateLabel')"
              :rules="valDateRules([t('validators.dateRules', 0)])"
              autofocus
              density="compact"
              required
              type="date"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="formularData.bookingTypeId === 3"
              v-model="formularData.sourceTax"
              :label="t('dialogs.addBooking.sourceTaxLabel')"
              @amount="(a) => { formularData.sourceTax = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-select
              v-if="formularData.bookingTypeId < 4 && formularData.bookingTypeId > 0"
              v-model="formularData.stockId"
              :item-title="CONS.DB.STORES.STOCKS.FIELDS.COMPANY"
              :item-value="CONS.DB.STORES.STOCKS.FIELDS.ID"
              :items="records.stocks.items.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
              :label="t('dialogs.addBooking.stockLabel')"
              :menu=false
              :menu-props="{ maxHeight: 250 }"
              :rules="valRequiredRules([t('validators.requiredRule', 0)])"
              density="compact"
              max-width="300"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-select
              v-if="formularData.bookingTypeId < 3 && formularData.bookingTypeId > 0"
              v-model="formularData.marketPlace"
              :items="settings.markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
              :label="t('dialogs.addBooking.marketPlaceLabel')"
              :menu=false
              :menuProps="{ maxHeight: 250 }"
              density="compact"
              max-width="350"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="formularData.bookingTypeId < 3 && formularData.bookingTypeId > 0"
              v-model="formularData.fee"
              :label="t('dialogs.addBooking.feeLabel')"
              @amount="(a) => { formularData.fee = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="formularData.bookingTypeId === 1"
              v-model="formularData.transactionTax"
              :label="t('dialogs.addBooking.transactionTaxLabel')"
              @amount="(a) => { formularData.transactionTax = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12">
          <v-text-field
              v-model="formularData.description"
              :label="t('dialogs.addBooking.descriptionLabel')"
              density="compact"
              required
              variant="outlined"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
