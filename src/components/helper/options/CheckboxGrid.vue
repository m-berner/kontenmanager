<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useBrowser} from '@/composables/useBrowser'
import {useNotification} from '@/composables/useNotification'
import {computed, defineProps, onBeforeMount, reactive, toRaw} from 'vue'

interface CheckboxGridProps {
  type: symbol
}

interface IState {
  checked: string[]
}

const checkboxGridProps = defineProps<CheckboxGridProps>()
const {t} = useI18n()
const {CONS} = useConstant()
const {log} = useNotification()

const {getStorage, setStorage} = useBrowser()

const state: IState = reactive({
  checked: []
})

const indexesKeys: string[] = Array.from(CONS.SETTINGS.INDEXES.keys())
const materialsKeys: string[] = Array.from(CONS.SETTINGS.MATERIALS.keys())

const boxes = computed((): { A: string[], B: string[] } => {
  let resultBoxes: { A: string[], B: string[] } = {A: [], B: []}
  switch (checkboxGridProps.type) {
    case CONS.CHECKBOX_GRID.TYPES.INDEXES:
      resultBoxes = {
        A: indexesKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.INDEXES.size / 2),
        B: indexesKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.INDEXES.size / 2)
      }
      break
    case CONS.CHECKBOX_GRID.TYPES.MATERIALS:
      resultBoxes = {
        A: materialsKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.MATERIALS.size / 2),
        B: materialsKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.MATERIALS.size / 2)
      }
      break
  }
  return resultBoxes
})

const setLabel = (item: string): string | undefined => {
  let resultLabel: string | undefined = ''
  switch (checkboxGridProps.type) {
    case CONS.CHECKBOX_GRID.TYPES.INDEXES:
      resultLabel = CONS.SETTINGS.INDEXES.get(item)
      break
    case CONS.CHECKBOX_GRID.TYPES.MATERIALS:
      resultLabel = t(`optionsPage.materials.${item}`)
      break
  }
  return resultLabel
}

const setChecked = async (): Promise<void> => {
  const checkedBoxes = toRaw(state.checked)
  switch (checkboxGridProps.type) {
    case CONS.CHECKBOX_GRID.TYPES.INDEXES:
      await setStorage(CONS.STORAGE.PROPS.INDEXES, checkedBoxes)
      break
    case CONS.CHECKBOX_GRID.TYPES.MATERIALS:
      await setStorage(CONS.STORAGE.PROPS.MATERIALS, checkedBoxes)
      break
  }
}

onBeforeMount(async () => {
  const storage = await getStorage([CONS.STORAGE.PROPS.INDEXES, CONS.STORAGE.PROPS.MATERIALS])
  switch (checkboxGridProps.type) {
    case CONS.CHECKBOX_GRID.TYPES.INDEXES:
      state.checked = storage[CONS.STORAGE.PROPS.INDEXES] as string[]
      break
    case CONS.CHECKBOX_GRID.TYPES.MATERIALS:
      state.checked = storage[CONS.STORAGE.PROPS.MATERIALS] as string[]
      break
  }
})

log('--- CheckboxGrid.vue setup ---')
</script>

<template>
  <v-col>
    <v-checkbox
        v-for="item in boxes.A"
        :key="item"
        v-model="state.checked"
        :label="setLabel(item)"
        :value="item"
        hide-details
        @change="setChecked"
    />
  </v-col>
  <v-col>
    <v-checkbox
        v-for="item in boxes.B"
        :key="item"
        v-model="state.checked"
        :label="setLabel(item)"
        :value="item"
        hide-details
        @change="setChecked"
    />
  </v-col>
</template>
