<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onMounted, type Reactive, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {storeToRefs} from 'pinia'
import {useAppApi} from '@/pages/background'

interface IDrawerControl {
  id: number
  title: string
  value: string
  class: string
}

interface IState {
  show: boolean
  drawerControls: IDrawerControl[]
}

const {n, t} = useI18n()
const {CONS} = useAppApi()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()
const {exchanges, indexes, materials} = storeToRefs(settings)

const state: Reactive<IState> = reactive({
  show: true,
  drawerControls: CONS.DEFAULTS.DRAWER_CONTROLS.map(() => ({
    id: 0,
    title: '',
    value: '',
    class: ''
  }))
})
const usd = (mat: string, usd = true): number => {
  if (usd) {
    return runtime.materials.get(mat) ?? 0
  }
  return (runtime.materials.get(mat) ?? 0) / runtime.exchangesCurUsd
}
// const updateDrawerControls = (): void => {
//   console.log('INFOBAR: updateDrawerControls')
//   for (let i = 0; i < CONS.DEFAULTS.DRAWER_KEYS.length; i++) {
//     state.drawerControls[i] = {id: i, title: '', value: '', class: ''}
//     // const percent =
//     // elem === 'winloss' ? ' / ' + n(records.transfers.total_controller.winlossPercent ?? 0, 'percent') : ''
//     state.drawerControls[i].id = i
//     state.drawerControls[i].title = t(`infoBar.drawerTitles.${CONS.DEFAULTS.DRAWER_KEYS[i]}`)
//     state.drawerControls[i].value = n(records.transfers.total_controller[CONS.DEFAULTS.DRAWER_KEYS[i]], 'currency') // + percent,
//     state.drawerControls[i].class = records.transfers.total_controller[CONS.DEFAULTS.DRAWER_KEYS[i]] < 0 ? CONS.DEFAULTS.DRAWER_KEYS[i] + '_minus' : CONS.DEFAULTS.DRAWER_KEYS[i]
//   }
// }
const updateDrawerControls = (): void => {
  console.log('INFOBAR: updateDrawerControls')
  state.drawerControls = CONS.DEFAULTS.DRAWER_KEYS.map((key, index) => {
    const value = records.totalController[key] ?? 0
    return {
      id: index,
      title: t(`infoBar.drawerTitles.${key}`),
      value: n(value, 'currency') +
        (key === 'winLoss' ? ' / ' + n(records.totalController.winLossPercent ?? 0, 'percent') : ''),
      class: value < 0 ? `${key}_minus` : key
    }
  })
}
// Typed watch handlers
// watch(
//   () => records.bookings.total_controller.dividends,
//   updateDrawerControls,
//   {immediate: true}
// )
// watch(
//   () => records.bookings.total_controller.depot,
//   updateDrawerControls
// )
// watch(
//   () => records.bookings.total_controller.account,
//   updateDrawerControls
// )
onMounted(() => {
  updateDrawerControls()
})
//         break
//     }
//   }
// }
//
// watch(() => records.bookings.total_controller.dividends, updateDrawerControls)
// watch(() => records.bookings.total_controller.depot, updateDrawerControls)
// watch(() => records.bookings.total_controller.account, updateDrawerControls)

//if (!browser.runtime.onMessage.hasListener(onMessageInfoBar)) {
// noinspection JSDeprecatedSymbols
//browser.runtime.onMessage.addListener(onMessageInfoBar)
//}
console.log('--- InfoBar.vue setup ---')
</script>

<template>
  <v-navigation-drawer v-model="state.show" app color="secondary" height="100%" v-bind:floating="true"
                       width="180">
    <v-card color="secondary" height="100%">
      <v-list lines="two">
        <v-list-item
          v-for="item in state.drawerControls"
          v-bind:key="item.id"
          v-bind:class="item.class"
          v-bind:subtitle="item.value"
          v-bind:title="item.title"
        ></v-list-item>
      </v-list>
    </v-card>
  </v-navigation-drawer>
  <v-app-bar app color="secondary" v-bind:flat="true">
    <v-app-bar-nav-icon variant="text" v-on:click="state.show = !state.show"></v-app-bar-nav-icon>
    <v-list bg-color="secondary" class="hide-scroll-bar" lines="two">
      <v-row>
        <v-list-item v-for="item in exchanges" v-bind:key="item">
          <v-list-item-title>{{ item }}</v-list-item-title>
          <v-list-item-subtitle>{{ n(runtime.exchanges.get(item) ?? 1, 'decimal3') }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-for="item in indexes" v-bind:key="item">
          <v-list-item-title>{{ CONS.SETTINGS.INDEXES.get(item) }}</v-list-item-title>
          <v-list-item-subtitle>{{ n(runtime.indexes.get(item) ?? 0, 'integer') }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-for="item in materials" v-bind:key="item">
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
