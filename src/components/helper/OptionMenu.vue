<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {onMounted} from 'vue'

interface PropsOptionMenu {
  recordID: number
  menuItems: Record<string, string>[]
}

const {CONS, log, notice} = useApp()
const optionMenuProps = defineProps<PropsOptionMenu>()
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
      case CONS.DIALOGS.UPDATE_BOOKING:
        runtime.setTeleport({
          dialogName: CONS.DIALOGS.UPDATE_BOOKING,
          okButton: true,
          visibility: true
        })
        break
      case CONS.DIALOGS.DELETE_BOOKING:
        records.deleteBooking(optionMenuProps.recordID)
        records.sumBookings()
        await browser.runtime.sendMessage(JSON.stringify({
          type: CONS.MESSAGES.DB__DELETE_BOOKING,
          data: optionMenuProps.recordID
        }))
        await notice([t('dialogs.deleteBooking.success')])
        for (const m of runtime.optionMenuColors.keys()) {
          runtime.optionMenuColors.set(m, '')
        }
        break
      case CONS.DIALOGS.UPDATE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.DIALOGS.UPDATE_STOCK,
          okButton: true,
          visibility: true
        })
        break
      case CONS.DIALOGS.DELETE_STOCK:
        const deleteAble = records.bookings.filter((booking) => {
          return optionMenuProps.recordID === booking.cStockID
        })
        if (deleteAble.length === 0) {
          records.deleteStock(optionMenuProps.recordID)
          await browser.runtime.sendMessage(JSON.stringify({
            type: CONS.MESSAGES.DB__DELETE_STOCK,
            data: optionMenuProps.recordID
          }))
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

log('--- OptionMenu.vue setup ---')
</script>

<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        icon="$dots"
        v-bind="props"
        v-bind:color="runtime.optionMenuColors.get(optionMenuProps.recordID ?? -1)"
        v-on:click="onButtonClick"
      ></v-btn>
    </template>
    <v-list>
      <v-hover v-slot:default="{ props, isHovering }">
        <v-list-item
          v-for="item in optionMenuProps.menuItems"
          v-bind:id="rt(item.id)"
          v-bind:key="rt(item.title)"
          class="pointer"
          v-bind="props"
          v-bind:base-color="isHovering ? 'orange' : ''"
          v-bind:prepend-icon="rt(item.icon)"
          v-bind:title="rt(item.title)"
          v-on:click="onIconClick"
        ></v-list-item>
      </v-hover>
    </v-list>
  </v-menu>
</template>
