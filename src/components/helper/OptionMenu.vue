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
import {onMounted} from 'vue'

interface PropsOptionMenu {
  recordID: number
  menuItems: Record<string, string>[]
}

const {CONS, log} = useApp()
const optionMenuProps = defineProps<PropsOptionMenu>()
const {rt} = useI18n()
const runtime = useRuntimeStore()

const onButtonClick = async (): Promise<void> => {
  log('OPTION_MENU: onButtonClick', {info: optionMenuProps.recordID})
  for (const m of runtime.optionMenuColors.keys()) {
    runtime.optionMenuColors.set(m, '')
  }
  runtime.optionMenuColors.set(optionMenuProps.recordID, 'green')
}
const onIconClick = async (ev: Event): Promise<void> => {
  log('OPTION_MENU: onIconClick', {info: optionMenuProps.recordID})
  runtime.setBookingId(optionMenuProps.recordID)
  const parse = async (elem: Element | null, loop = 0): Promise<void> => {
    if (loop > 6 || elem === null) return
    switch (elem!.id) {
      case CONS.DIALOGS.DELETE_BOOKING:
        runtime.setTeleport({
          dialogName: CONS.DIALOGS.DELETE_BOOKING,
          okButton: true,
          visibility: true
        })
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
