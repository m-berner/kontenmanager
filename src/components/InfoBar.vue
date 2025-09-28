<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'

export interface _IDrawerControl {
  id: number
  title: string
  value: string
  class: string
}

interface IState {
  show: boolean
  drawerControls: _IDrawerControl[]
  totalController: any
}

const {n, t} = useI18n()
const {CONS, log} = useApp()
const runtime = useRuntime()
const settings = useSettings()

const state: IState = reactive({
  show: false,
  drawerControls: CONS.DEFAULTS.DRAWER_CONTROLS.map(() => ({
    id: 0,
    title: '',
    value: '',
    class: ''
  })),
  totalController: {}
})

const usd = (mat: string, usd = true): number => {
  const materialCode = CONS.SETTINGS.MATERIALS.get(mat) ?? ''
  if (usd) {
    return runtime.infoMaterials.value.get(materialCode) ?? 0
  }
  return (runtime.infoMaterials.value.get(materialCode) ?? 0) / runtime.curUsd.value
}
const updateDrawerControls = (): void => {
  log('INFO_BAR: updateDrawerControls')
  state.drawerControls = CONS.DEFAULTS.DRAWER_KEYS.map((key, index) => {
    const value = state.totalController[key] ?? 0
    return {
      id: index,
      title: t(`infoBar.drawerTitles.${key}`),
      value: key === 'winLoss' ? `${n(value, 'currency')} ' / ' ${n(state.totalController.winLossPercent ?? 0, 'percent')}` : '',
      class: value < 0 ? `${key}_minus` : key
    }
  })
}

onMounted(() => {
  updateDrawerControls()
})

log('--- InfoBar.vue setup ---')
</script>

<template>
  <v-navigation-drawer
      v-model="state.show"
      :floating="true"
      app
      color="secondary"
      height="100%"
      width="180">
    <v-card color="secondary" height="100%">
      <v-list lines="two">
        <v-list-item
            v-for="item in state.drawerControls"
            :key="item.id"
            :class="item.class"
            :subtitle="item.value"
            :title="item.title"/>
      </v-list>
    </v-card>
  </v-navigation-drawer>
  <v-app-bar app color="secondary" flat>
    <v-app-bar-nav-icon
        variant="text"
        @click="state.show = !state.show"/>
    <v-list bg-color="secondary" class="hide-scroll-bar" lines="two">
      <v-row>
        <v-list-item v-for="item in settings.exchanges.value" :key="item">
          <v-list-item-title>{{ item }}</v-list-item-title>
          <v-list-item-subtitle>{{ n(runtime.infoExchanges.value.get(item) ?? 1, 'decimal3') }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-for="item in settings.indexes.value" :key="item">
          <v-list-item-title>{{ CONS.SETTINGS.INDEXES.get(item) }}</v-list-item-title>
          <v-list-item-subtitle>{{ n(runtime.infoIndexes.value.get(item) ?? 0, 'integer') }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-for="item in settings.materials.value" :key="item">
          <v-list-item-title>{{ t('optionsPage.materials.' + item) }}</v-list-item-title>
          <v-list-item-subtitle
          >{{ n(usd(item), 'currencyUSD') + ' / ' + n(usd(item, false), 'currency') }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-row>
    </v-list>
  </v-app-bar>
</template>

<!--suppress CssUnusedSymbol -->
<style scoped>
.winLoss {
  font-weight: bold;
  color: green;
}

.winLoss_minus,
.fees_minus,
.taxes_minus,
.withdrawals_minus,
.account_minus,
.earnings_minus {
  color: red;
}

.hide-scroll-bar {
  overflow: hidden;
}
</style>
