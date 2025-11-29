<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IExchangeData} from '@/types'
import {computed, defineProps, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'

interface IT {
  STRINGS: Record<string, string>
}

interface DynamicListProps {
  type: symbol
  hint?: string
  placeholder?: string
}

const dynamicListProps = defineProps<DynamicListProps>()
const {t} = useI18n()
const {CONS, log} = useApp()
const {getStorage, setStorage} = useBrowser()
const {fetchExchangesData} = useFetch()

const T = Object.freeze<IT>({
  STRINGS: {
    EXCHANGES_LABEL: t('optionsPage.exchanges.label'),
    MARKETS_LABEL: t('optionsPage.markets.label'),
    EXCHANGES_TITLE: t('optionsPage.exchanges.title'),
    MARKETS_TITLE: t('optionsPage.markets.title')
  }
})

const newItem = ref<string>('')
const list = ref<string[]>([])

const label = computed<string>(() => {
  let resultLabel = 'Error'
  switch (dynamicListProps.type) {
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultLabel = T.STRINGS.EXCHANGES_LABEL
      break
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      resultLabel = T.STRINGS.MARKETS_LABEL
      break
    default:
  }
  return resultLabel
})
const title = computed<string>(() => {
  let resultTitle = 'Error'
  switch (dynamicListProps.type) {
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultTitle = T.STRINGS.EXCHANGES_TITLE
      break
    case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      resultTitle = T.STRINGS.MARKETS_TITLE
      break
    default:
  }
  return resultTitle
})

const addItem = async (item: string): Promise<void> => {
  log('DYNAMIC_LIST: addItem')
  const {infoExchanges} = useRuntimeStore()
  const {exchanges, markets} = useSettingsStore()
  if (!list.value?.includes(item)) {
    switch (dynamicListProps.type) {
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
        list.value.push(item)
        markets.push(item)
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS, [...list.value])
        break
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
        list.value.push(item.toUpperCase())
        exchanges.push(item)
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES, [...list.value])
        const exchangesInfoData: IExchangeData[] = await fetchExchangesData([...newItem.value])
        infoExchanges.set(exchanges[exchanges.length], exchangesInfoData[0].value)
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
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS, [...list.value])
        break
      case CONS.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES, [...list.value])
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
