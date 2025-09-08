<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {Ref} from 'vue'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const selected: Ref<number> = ref(-1)
const isFormValid: Ref<boolean> = ref(false)

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    notice([t('dialogs.addAccount.invalidForm')])
    return false
  }

  return true
}

const onClickOk = async (): Promise<void> => {
  log('DELETE_BOOKING_TYPE : onClickOk')
  if (!validateForm()) return

  try {
    if (selected.value > 1) {
      records.bookingTypes.deleteBookingType(selected.value)
      await notice([t('dialogs.deleteBookingType.success')])
    } else {
      await notice(['Start kann nicht entfernt werden'])
    }
    runtime.resetTeleport()
  } catch (e) {
    log('DELETE_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.deleteBookingType.error')])
  }
}
const title = t('dialogs.deleteBookingType.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('DELETE_BOOKING_TYPE: onMounted')
})

log('--- DeleteBookingType.vue setup ---')
</script>

<template>
  <v-form
      v-model="isFormValid"
      validate-on="submit"
      @submit.prevent>
    <v-select
        v-model="selected"
        :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
        :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
        :items="records.bookingTypes.items"
        :label="t('dialogs.deleteBookingType.label')"
        density="compact"
        required
        variant="outlined"
    />
  </v-form>
</template>
