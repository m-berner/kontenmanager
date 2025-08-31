<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineProps, onBeforeMount, reactive, toRaw} from 'vue'
import {useConstant} from '@/composables/useConstant'
import {useBrowser} from '@/composables/useBrowser'
import {useNotification} from '@/composables/useNotification'
import {useI18n} from 'vue-i18n'

interface DynamicListProps {
  type: symbol
  hint?: string
  placeholder?: string
}

interface IState {
  newItem: string
  list: string[]
  markets: string[]
  exchanges: string[]
}

const dynamicListProps = defineProps<DynamicListProps>()
const {t} = useI18n()
const {CONS} = useConstant()
const {log} = useNotification()
const {getStorage, setStorage} = useBrowser()

const state: IState = reactive<IState>({
  newItem: '',
  list: [],
  markets: [],
  exchanges: []
})

const label = computed((): string => {
  let resultLabel = 'Error'
  switch (dynamicListProps.type) {
    case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultLabel = t('optionsPage.exchanges.label')
      break
    case CONS.DYNAMIC_LIST.TYPES.MARKETS:
      resultLabel = t('optionsPage.markets.label')
      break
    default:
  }
  return resultLabel
})

const title = computed((): string => {
  let resultTitle = 'Error'
  switch (dynamicListProps.type) {
    case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
      resultTitle = t('optionsPage.exchanges.title')
      break
    case CONS.DYNAMIC_LIST.TYPES.MARKETS:
      resultTitle = t('optionsPage.markets.title')
      break
    default:
  }
  return resultTitle
})

const addItem = async (item: string): Promise<void> => {
  log('DYNAMIC_LIST: addItem')
  if (!state.list?.includes(item)) {
    switch (dynamicListProps.type) {
      case CONS.DYNAMIC_LIST.TYPES.MARKETS:
        state.list.push(item)
        await setStorage(CONS.STORAGE.PROPS.MARKETS, toRaw(state.list))
        break
      case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
        state.list.push(item.toUpperCase())
        await setStorage(CONS.STORAGE.PROPS.EXCHANGES, toRaw(state.list))
        break
      default:
    }
    state.newItem = ''
  }
}
const removeItem = async (n: number): Promise<void> => {
  log('DYNAMIC_LIST: removeItem')
  if (n > 0) {
    state.list.splice(n, 1)
    state.newItem = ''
    switch (dynamicListProps.type) {
      case CONS.DYNAMIC_LIST.TYPES.MARKETS:
        await setStorage(CONS.STORAGE.PROPS.MARKETS, toRaw(state.list))
        break
      case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
        await setStorage(CONS.STORAGE.PROPS.EXCHANGES, toRaw(state.list))
        break
      default:
    }
  }
}

onBeforeMount(async () => {
  const storage = await getStorage([CONS.STORAGE.PROPS.MARKETS, CONS.STORAGE.PROPS.EXCHANGES])
  switch (dynamicListProps.type) {
    case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
      state.list = storage[CONS.STORAGE.PROPS.EXCHANGES] as string[]
      break
    case CONS.DYNAMIC_LIST.TYPES.MARKETS:
      state.list = storage[CONS.STORAGE.PROPS.MARKETS] as string[]
      break
  }
})

log('--- DynamicList.vue setup ---')
</script>

<template>
  <v-card :title="title" color="secondary">
    <v-list bg-color="secondary">
      <v-list-item
          v-for="(item, i) in state.list"
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
          v-model="state.newItem"
          :autofocus="true"
          :clearable="true"
          :label="label"
          :placeholder="dynamicListProps.placeholder"
          type="text">
        <template v-slot:append>
          <v-btn class="ml-3"
                 color="primary"
                 icon="$add"
                 @click="addItem(state.newItem)"/>
        </template>
      </v-text-field>
    </v-card-actions>
  </v-card>
</template>
