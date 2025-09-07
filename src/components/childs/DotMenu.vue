<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineProps, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBookingsDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'

interface PropsOptionMenu {
  recordID: number
  menuItems: Record<string, string>[]
}

const optionMenuProps = defineProps<PropsOptionMenu>()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {deleteBooking} = useBookingsDB()
const {deleteStock} = useStocksDB()
const {rt, t} = useI18n()
const runtime = useRuntimeStore()
const records = useRecordsStore()

const onButtonClick = async (): Promise<void> => {
  log('OPTION_MENU: onButtonClick', {info: optionMenuProps.recordID})
  for (const m of runtime.optionMenuColors.keys()) {
    runtime.optionMenuColors.set(m, '')
  }
  runtime.optionMenuColors.set(optionMenuProps.recordID, 'green')
}
const onIconClick = async (ev: Event): Promise<void> => {
  log('OPTION_MENU: onIconClick', {info: optionMenuProps.recordID})
  runtime.setActiveId(optionMenuProps.recordID)
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
        records.bookings.deleteBooking(optionMenuProps.recordID)
        records.bookings.sumBookings()
        await deleteBooking(optionMenuProps.recordID)
        await notice([t('dialogs.deleteBooking.success')])
        for (const m of runtime.optionMenuColors.keys()) {
          runtime.optionMenuColors.set(m, '')
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
          records.stocks.deleteStock(optionMenuProps.recordID)
          await deleteStock(optionMenuProps.recordID)
          await notice([t('dialogs.deleteStock.success')])
        } else {
          await notice(['Dieses Unternehmen kann nicht gelöscht werden. Es existieren Buchungen.'])
        }
        for (const m of runtime.optionMenuColors.keys()) {
          runtime.optionMenuColors.set(m, '')
        }
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
  runtime.optionMenuColors.set(optionMenuProps.recordID, '')
})

log('--- DotMenu.vue setup ---')
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
