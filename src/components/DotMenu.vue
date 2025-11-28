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
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB, useStocksDB} from '@/composables/useIndexedDB'

interface OptionMenuProps {
  recordID: number
  menuItems: readonly IMenuItem[]
}

interface IT {
  MESSAGES: Record<string, string>
}

const optionMenuProps = defineProps<OptionMenuProps>()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {remove: removeBooking} = useBookingsDB()
const {remove: removeStock} = useStocksDB()
const {rt, t} = useI18n()
const runtime = useRuntimeStore()
const {optionMenuColors} = storeToRefs(runtime)
const records = useRecordsStore()
const {info} = useAlertStore()

const T = Object.freeze<IT>({
  MESSAGES: {
    INFO_TITLE: t('messages.infoTitle'),
    NO_DELETE: t('messages.noDelete')
  }
})

const onButtonClick = async (): Promise<void> => {
  log('OPTION_MENU: onButtonClick', {info: optionMenuProps.recordID})
  for (const m of optionMenuColors.value.keys()) {
    optionMenuColors.value.set(m, '')
  }
  optionMenuColors.value.set(optionMenuProps.recordID, 'green')
}

const onIconClick = async (ev: Event): Promise<void> => {
  log('OPTION_MENU: onIconClick', {info: optionMenuProps.recordID})
  runtime.activeId = optionMenuProps.recordID
  const {items: bookingItems} = storeToRefs(records.bookings)
  const {items: stockItems} = storeToRefs(records.stocks)
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
        for (const m of optionMenuColors.value.keys()) {
          optionMenuColors.value.set(m, '')
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
        const deleteAble = bookingItems.value.filter((booking) => {
          return optionMenuProps.recordID === booking.cStockID
        })
        if (deleteAble.length === 0) {
          records.stocks.remove(optionMenuProps.recordID)
          await removeStock(optionMenuProps.recordID)
          await notice([t('dialogs.deleteStock.success')])
        } else {
          info(T.MESSAGES.INFO_TITLE, T.MESSAGES.NO_DELETE, null)
        }
        for (const m of optionMenuColors.value.keys()) {
          optionMenuColors.value.set(m, '')
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
        window.open(stockItems.value[records.stocks.getIndexById(optionMenuProps.recordID)].cURL)
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
  optionMenuColors.value.set(optionMenuProps.recordID, '')
})
</script>

<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
          :color="runtime.optionMenuColors.get(optionMenuProps.recordID ?? -1)"
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
