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
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useValidation} from '@/composables/useValidation'
import {useBookingTypesDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {remove} = useBookingTypesDB()
const {validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntime()

const selected = ref()
const formRef = ref<HTMLFormElement | null>(null)

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (!records.bookings.hasBookingType(selected.value)) {
      records.bookingTypes.remove(selected.value)
      await remove(selected.value)
      await notice([t('dialogs.deleteBookingType.success')])
    } else {
      await notice([t('dialogs.deleteBookingType.error1a'), t('dialogs.deleteBookingType.error1b')])
    }
    runtime.resetTeleport()
  } catch (e) {
    log('DELETE_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.deleteBookingType.catch')])
  }
}

const title = t('dialogs.deleteBookingType.title')

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
        :label="t('dialogs.deleteBookingType.label')"
        :placeholder="t('dialogs.deleteBookingType.placeholder')"
        autocomplete
        autofocus
        clearable
        density="compact"
        variant="outlined"
        @focus="formRef?.resetValidation()"/>
  </v-form>
</template>
