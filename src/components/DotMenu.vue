<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IMenuItem} from '@/types'
import {defineProps, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useAlert} from '@/composables/useAlert'

interface OptionMenuProps {
  recordID: number
  menuItems: IMenuItem[]
}

const optionMenuProps = defineProps<OptionMenuProps>()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {remove: removeBooking} = useBookingsDB()
const {remove: removeStock} = useStocksDB()
const {rt, t} = useI18n()
const runtime = useRuntime()
const records = useRecordsStore()
const alert = useAlert()

const MESSAGES = Object.freeze({
  INFO_TITLE: t('appPage.messages.infoTitle'),
  NO_DELETE: t('appPage.messages.noDelete')
})

const onButtonClick = async (): Promise<void> => {
  log('OPTION_MENU: onButtonClick', {info: optionMenuProps.recordID})
  for (const m of runtime.optionMenuColors.value.keys()) {
    runtime.optionMenuColors.value.set(m, '')
  }
  runtime.optionMenuColors.value.set(optionMenuProps.recordID, 'green')
}
const onIconClick = async (ev: Event): Promise<void> => {
  log('OPTION_MENU: onIconClick', {info: optionMenuProps.recordID})
  runtime.activeId.value = (optionMenuProps.recordID)
  const parse = async (elem: Element | null, loop = 0): Promise<void> => {
    if (loop > 6 || elem === null) return
    switch (elem!.id) {
      case CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_BOOKING:
        records.bookings.remove(optionMenuProps.recordID)
        await removeBooking(optionMenuProps.recordID)
        await notice([t('dialogs.deleteBooking.success')])
        for (const m of runtime.optionMenuColors.value.keys()) {
          runtime.optionMenuColors.value.set(m, '')
        }
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_STOCK:
        const deleteAble = records.bookings.items.filter((booking) => {
          return optionMenuProps.recordID === booking.cStockID
        })
        if (deleteAble.length === 0) {
          records.stocks.remove(optionMenuProps.recordID)
          await removeStock(optionMenuProps.recordID)
          await notice([t('dialogs.deleteStock.success')])
        } else {
          alert.info(MESSAGES.INFO_TITLE, MESSAGES.NO_DELETE, null)
        }
        for (const m of runtime.optionMenuColors.value.keys()) {
          runtime.optionMenuColors.value.set(m, '')
        }
        break
      case CONS.COMPONENTS.DIALOGS.SHOW_STOCK_DIVIDEND:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.SHOW_STOCK_DIVIDEND,
          dialogOk: false,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.OPEN_LINK:
        window.open(records.stocks.items[records.stocks.getIndexById(optionMenuProps.recordID)].cURL)
        break
      default:
        loop += 1
        await parse(elem!.parentElement, loop)
    }
  }
  if (ev.target instanceof Element) {
    await parse(ev.target)
  }
}

onMounted(() => {
  runtime.optionMenuColors.value.set(optionMenuProps.recordID, '')
})
</script>

<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
          :color="runtime.optionMenuColors.value.get(optionMenuProps.recordID ?? -1)"
          icon="$dots"
          v-bind="props"
          @click="onButtonClick"
      />
    </template>
    <v-list>
      <v-hover v-slot:default="{ props, isHovering }">
        <v-list-item
            v-for="item in optionMenuProps.menuItems"
            :id="rt(item.id)"
            :key="rt(item.title)"
            :base-color="isHovering ? 'orange' : ''"
            :prepend-icon="rt(item.icon)"
            :title="rt(item.title)"
            class="pointer"
            v-bind="props"
            @click="onIconClick"
        />
      </v-hover>
    </v-list>
  </v-menu>
</template>
