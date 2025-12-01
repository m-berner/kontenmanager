<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useValidation} from '@/composables/useValidation'
import {useBookingTypesDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {remove} = useBookingTypesDB()
const {validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_ADD: t('messages.deleteBookingType.success'),
    ERROR_ADD: t('messages.deleteBookingType.error'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('dialogs.deleteBookingType.title'),
    BOOKING_TYPE_LABEL: t('dialogs.deleteBookingType.bookingTypeLabel'),
    PLACEHOLDER: t('dialogs.deleteBookingType.placeholder')
  }
})

const selected = ref()
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (!records.bookings.hasBookingType(selected.value)) {
      records.bookingTypes.remove(selected.value)
      await remove(selected.value)
      await notice([T.MESSAGES.SUCCESS_ADD])
    } else {
      await notice([T.MESSAGES.ERROR_ADD])
    }
    runtime.resetTeleport()
  } catch (e) {
    if (e instanceof Error) {
      log(T.MESSAGES.ERROR_ONCLICK_OK, {error: e.message})
      await notice([T.MESSAGES.ERROR_ONCLICK_OK, e.message])
    } else {
      throw new Error(`${T.MESSAGES.ERROR_ONCLICK_OK}: unknown`)
    }
  }
}
const title = T.STRINGS.TITLE
defineExpose({title, onClickOk})

log('--- DeleteBookingType.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-select
        v-model="selected"
        :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.items"
        :label="T.STRINGS.BOOKING_TYPE_LABEL"
        :placeholder="T.STRINGS.PLACEHOLDER"
        autocomplete
        autofocus
        clearable
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
