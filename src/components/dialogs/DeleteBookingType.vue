<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {Ref} from 'vue'
import {defineExpose, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useValidation} from '@/composables/useValidation'
import {useRuntimeStore} from '@/stores/runtime'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {requiredSelect, validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const selected: Ref<number> = ref(0)
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    if (records.bookings.includeBookingTypeId(selected.value) < 0) {
      records.bookingTypes.deleteBookingType(selected.value)
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
        :rules="requiredSelect([t('dialogs.deleteBookingType.rule1')])"
        density="compact"
        required
        variant="outlined"
        @focus="formRef?.resetValidation()"
    />
  </v-form>
</template>
