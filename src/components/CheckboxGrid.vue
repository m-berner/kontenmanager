<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineProps, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import type {ICheckboxGridProps} from '@/types'

const props = defineProps<ICheckboxGridProps>()
const {t} = useI18n()
const {CONS} = useApp()
const {getStorage, setStorage} = useBrowser()

const T = Object.freeze<{STRINGS: Record<string, string>}>({
  STRINGS: {
    au: t('optionsPage.materials.au'),
    ag: t('optionsPage.materials.ag'),
    brent: t('optionsPage.materials.brent'),
    wti: t('optionsPage.materials.wti'),
    cu: t('optionsPage.materials.cu'),
    pt: t('optionsPage.materials.pt'),
    al: t('optionsPage.materials.al'),
    ni: t('optionsPage.materials.ni'),
    sn: t('optionsPage.materials.sn'),
    pb: t('optionsPage.materials.pb'),
    pd: t('optionsPage.materials.pd')
  }
})

const checked = ref<string[]>([])

const boxes = computed((): { A: string[], B: string[] } => {
  const indexesKeys: string[] = Array.from(CONS.SETTINGS.INDEXES.keys())
  const materialsKeys: string[] = Array.from(CONS.SETTINGS.MATERIALS.keys())
  let resultBoxes: { A: string[], B: string[] } = {A: [], B: []}
  switch (props.type) {
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
      resultBoxes = {
        A: indexesKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.INDEXES.size / 2),
        B: indexesKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.INDEXES.size / 2)
      }
      break
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      resultBoxes = {
        A: materialsKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.MATERIALS.size / 2),
        B: materialsKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.MATERIALS.size / 2)
      }
      break
  }
  return resultBoxes
})

const setLabel = (item: string, labels: Record<string, string>): string | undefined => {
  let resultLabel: string | undefined = ''
  switch (props.type) {
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
      resultLabel = CONS.SETTINGS.INDEXES.get(item)
      break
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      resultLabel = labels[item]
      break
  }
  return resultLabel
}

const setChecked = async (): Promise<void> => {
  const checkedBoxes = checked.value
  switch (props.type) {
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES, [...checkedBoxes])
      break
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS, [...checkedBoxes])
      break
  }
}

onBeforeMount(async () => {
  const storage = await getStorage([CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES, CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS])
  switch (props.type) {
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
      checked.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES] as string[]
      break
    case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      checked.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS] as string[]
      break
  }
})
</script>

<template>
  <v-col>
    <v-checkbox
        v-for="item in boxes.A"
        :key="item"
        v-model="checked"
        :label="setLabel(item, T.STRINGS)"
        :value="item"
        hide-details
        @change="setChecked"
    />
  </v-col>
  <v-col>
    <v-checkbox
        v-for="item in boxes.B"
        :key="item"
        v-model="checked"
        :label="setLabel(item, T.STRINGS)"
        :value="item"
        hide-details
        @change="setChecked"
    />
  </v-col>
</template>
