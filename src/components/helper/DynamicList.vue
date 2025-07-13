<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {reactive, type Reactive, toRaw} from 'vue'
import {useAppApi} from '@/pages/background'

interface DynamicListProps {
  title: string
  list: string[]
  label: string
  type: symbol
  hint?: string
  placeholder?: string
}

interface IState {
  newItem: string
  list: string[]
}

const {CONS, log} = useAppApi()
const dynamicListProps = defineProps<DynamicListProps>()

const state: Reactive<IState> = reactive<IState>({
  newItem: '',
  list: [...dynamicListProps.list]
})

// NOTE:
// reading a v-text-field does work without reactivity
// write to it only with reactivity
const mAddItem = async (item: string): Promise<void> => {
  log('DYNAMIC_LIST: mAddItem')
  if (!state.list?.includes(item)) {
    let newItem = ''
    let storageItem = {}
    switch (dynamicListProps.type) {
      case CONS.DYNAMIC_LIST.TYPES.MARKETS:
        newItem = item
        storageItem = {[CONS.STORAGE.PROPS.MARKETS]: toRaw(state.list)}
        break
      case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
        newItem = item.toUpperCase()
        storageItem = {[CONS.STORAGE.PROPS.EXCHANGES]: toRaw(state.list)}
        break
      default:
    }
    state.list.push(newItem)
    state.newItem = ''
    await browser.storage.local.set(storageItem)
  }
}
const mRemoveItem = async (n: number): Promise<void> => {
  log('DYNAMIC_LIST: mRemoveItem')
  if (n > 0) {
    let storageItem = {}
    switch (dynamicListProps.type) {
      case CONS.DYNAMIC_LIST.TYPES.MARKETS:
        storageItem = {[CONS.STORAGE.PROPS.MARKETS]: toRaw(state.list)}
        break
      case CONS.DYNAMIC_LIST.TYPES.EXCHANGES:
        storageItem = {[CONS.STORAGE.PROPS.EXCHANGES]: toRaw(state.list)}
        break
      default:
    }
    state.list.splice(n, 1)
    state.newItem = ''
    await browser.storage.local.set({storageItem})
  }
}

log('--- DynamicList.vue setup ---')
</script>

<template>
  <v-card color="secondary" v-bind:title="dynamicListProps.title">
    <v-list bg-color="secondary">
      <v-list-item
        v-for="(item, i) in state.list"
        v-bind:key="item"
        hide-details
        v-bind:title="item">
        <template v-slot:prepend>
          <v-btn
            class="mr-3"
            icon="$close"
            v-on:click="mRemoveItem(i)"></v-btn>
        </template>
      </v-list-item>
    </v-list>
    <v-card-actions>
      <v-text-field
        v-model="state.newItem"
        type="text"
        v-bind:autofocus="true"
        v-bind:clearable="true"
        v-bind:label="dynamicListProps.label"
        v-bind:placeholder="dynamicListProps.placeholder">
        <template v-slot:append>
          <v-btn class="ml-3"
                 color="primary"
                 icon="$add"
                 v-on:click="mAddItem(state.newItem)"></v-btn>
        </template>
      </v-text-field>
    </v-card-actions>
  </v-card>
</template>
