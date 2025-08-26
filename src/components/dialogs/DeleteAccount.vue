<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, reactive, toRaw} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'

interface IState {
  selected: number
}

const {t} = useI18n()
const {CONS, log, notice} = useApp()
const {sendMessage, setStorage} = useBrowser()
const records = useRecordsStore()
const settings = useSettingsStore()

const state: IState = reactive({
  selected: records.accounts.length > 0 ? records.accounts[0].cID : -1
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_ACCOUNT : onClickOk')
  if (state.selected === -1) {
    await notice([t('dialogs.deleteAccount.error')])
    return
  }
  try {
    records.deleteAccount(state.selected)
    await sendMessage(JSON.stringify({
      type: CONS.MESSAGES.DB__DELETE_ACCOUNT,
      data: toRaw(state.selected)
    }))
    if (records.accounts.length > 0) {
      settings.setActiveAccountId(records.accounts[0].cID)
      await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, toRaw(records.accounts[0].cID))
    } else {
      settings.setActiveAccountId(-1)
      await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, 0)
    }
    //runtime.setLogo()
    records.sumBookings()
    await notice([t('dialogs.deleteAccount.success')])
    state.selected = -1
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteAccount.error')])
  }
}
const title = t('dialogs.deleteAccount.title')
defineExpose({onClickOk, title})

log('--- DeleteAccount.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-select
        v-if="records.accounts.length > 0"
        v-model="state.selected"
        :item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
        :item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
        :items="records.accounts"
        :label="t('dialogs.deleteAccount.accountNumberLabel')"
        density="compact"
        required
        variant="outlined"
    ></v-select>
    <v-text-field
        v-else
        density="compact"
        variant="outlined">{{ 'No account to delete' }}
    </v-text-field>
  </v-form>
</template>
