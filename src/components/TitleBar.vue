<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccountDB, IBookingDB, IBookingTypeDB, IStockDB, IStockOnlyMemory, IStores} from '@/types'
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const {CONS} = useConstant()
const {log} = useNotification()
const {setStorage} = useBrowser()
const {getAllAccounts} = useAccountsDB()
const {getAllBookings} = useBookingsDB()
const {getAllBookingTypes} = useBookingTypesDB()
const {getAllStocks} = useStocksDB()

const onUpdateTitleBar = async (): Promise<void> => {
  await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, settings.activeAccountId)
  const accounts: IAccountDB[] = await getAllAccounts()
  const bookings: IBookingDB[] = await getAllBookings()
  const bookingTypes: IBookingTypeDB[] = await getAllBookingTypes()
  const stocks: IStockDB[] = await getAllStocks()
  const stocksOnlyMemory: IStockOnlyMemory = {
    mPortfolio: 0,
    mChange: 0,
    mBuyValue: 0,
    mEuroChange: 0,
    mMin: 0,
    mValue: 0,
    mMax: 0
  }
  const stores: IStores = {
    accounts,
    bookings,
    bookingTypes,
    stocks: stocks.map((stock) => {
      return {...stock, ...stocksOnlyMemory}
    })
  }
  if (stores.accounts.length > 0) {
    records.initStore(stores)
    records.bookings.sumBookings()
  }
}
const logoUrl = computed((): string => {
  const ind = records.accounts.getAccountIndexById(settings.activeAccountId)
  if (ind > -1) {
    return records.accounts.items[ind].cLogoUrl
  } else {
    return ''
  }
})
const balance = computed((): string => {
  return n(records.bookings.sumBookings(), 'currency')
})

log('--- TitleBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <template #prepend>
      <img :alt="t('titleBar.iconsAlt.logo')" :src="CONS.COMPONENTS.TITLE_BAR.LOGO"/>
    </template>
    <v-app-bar-title>{{ t('titleBar.title') }}</v-app-bar-title>
    <v-text-field
        :disabled="true"
        :label="t('titleBar.bookingsSumLabel')"
        :model-value="balance"
        hide-details
        max-width="150"/>
    <v-spacer/>
    <v-select
        v-model="settings.activeAccountId"
        :item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
        :item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
        :items="records.accounts.items"
        :label="t('titleBar.selectAccountLabel')"
        density="compact"
        hide-details
        max-width="350"
        variant="outlined"
        @update:model-value="onUpdateTitleBar">
      <template #prepend>
        <img :alt="t('titleBar.iconsAlt.brandfetch')" :src="logoUrl"/>
      </template>
    </v-select>
  </v-app-bar>
</template>
