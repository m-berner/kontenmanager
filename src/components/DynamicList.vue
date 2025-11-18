<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineProps, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'

interface DynamicListProps {
  type: symbol
  hint?: string
  placeholder?: string
}

const dynamicListProps = defineProps<DynamicListProps>()
const {t} = useI18n()
const {CONS, log} = useApp()
const {getStorage, setStorage} = useBrowser()

const newItem = ref<string>('')
const list = ref<string[]>([])

const label = computed<string>(() => {
  let resultLabel = 'Error'
  switch (dynamicListProps.type) {
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultLabel = t('optionsPage.exchanges.label')
      break
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      resultLabel = t('optionsPage.markets.label')
      break
    default:
  }
  return resultLabel
})
const title = computed<string>(() => {
  let resultTitle = 'Error'
  switch (dynamicListProps.type) {
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultTitle = t('optionsPage.exchanges.title')
      break
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      resultTitle = t('optionsPage.markets.title')
      break
    default:
  }
  return resultTitle
})

const addItem = async (item: string): Promise<void> => {
  log('DYNAMIC_LIST: addItem')
  if (!list.value?.includes(item)) {
    switch (dynamicListProps.type) {
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
        list.value.push(item)
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS, [...list.value])
        break
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
        list.value.push(item.toUpperCase())
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES, [...list.value])
        break
      default:
    }
    newItem.value = ''
  }
}
const removeItem = async (n: number): Promise<void> => {
  log('DYNAMIC_LIST: removeItem')
  if (n > 0) {
    list.value.splice(n, 1)
    newItem.value = ''
    switch (dynamicListProps.type) {
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS, list.value)
        break
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES, list.value)
        break
      default:
    }
  }
}

onBeforeMount(async () => {
  const storage = await getStorage([CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS, CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES])
  switch (dynamicListProps.type) {
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      list.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES] as string[]
      break
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      list.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS] as string[]
      break
  }
})
</script>

<template>
  <v-card :title="title" color="secondary">
    <v-list bg-color="secondary">
      <v-list-item
          v-for="(item, i) in list"
          :key="item"
          :title="item"
          hide-details>
        <template v-slot:prepend>
          <v-btn
              class="mr-3"
              icon="$close"
              @click="removeItem(i)"/>
        </template>
      </v-list-item>
    </v-list>
    <v-card-actions>
      <v-text-field
          v-model="newItem"
          :autofocus="true"
          :clearable="true"
          :label="label"
          :placeholder="dynamicListProps.placeholder"
          type="text">
        <template v-slot:append>
          <v-btn
              class="ml-3"
              color="primary"
              icon="$add"
              @click="addItem(newItem)"/>
        </template>
      </v-text-field>
    </v-card-actions>
  </v-card>
</template>
