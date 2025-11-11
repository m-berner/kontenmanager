<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {storeToRefs} from 'pinia'

const {n, t} = useI18n()
const {CONS, log} = useApp()
const runtime = useRuntimeStore()
const {curUsd, infoMaterials} = storeToRefs(runtime)
const settings = useSettingsStore()

const usd = (mat: string, usd = true): number => {
  const materialCode = CONS.SETTINGS.MATERIALS.get(mat) ?? ''
  if (usd) {
    return infoMaterials.value.get(materialCode) ?? 0
  }
  return (infoMaterials.value.get(materialCode) ?? 0) / curUsd.value
}

log('--- InfoBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <v-list bg-color="secondary" class="horizontal-list" lines="two">
      <v-list-item v-for="item in settings.exchanges" :key="item">
        <v-list-item-title>{{ item }}</v-list-item-title>
        <v-list-item-subtitle>{{ n(runtime.infoExchanges.get(item) ?? 1, 'decimal3') }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.indexes" :key="item">
        <v-list-item-title>{{ CONS.SETTINGS.INDEXES.get(item) }}</v-list-item-title>
        <v-list-item-subtitle>{{ n(runtime.infoIndexes.get(item) ?? 0, 'integer') }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.materials" :key="item">
        <v-list-item-title>{{ t('optionsPage.materials.' + item) }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ n(usd(item), 'currencyUSD') + ' / ' + n(usd(item, false), 'currency') }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-app-bar>
</template>

<style scoped>
.horizontal-list {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;

  /* Hide scrollbar */

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
