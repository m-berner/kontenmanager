<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'
import {useTheme} from 'vuetify'
import {reactive, toRaw} from 'vue'
import {useAppApi} from '@/pages/background'
import DynamicList from '@/components/helper/DynamicList.vue'
import {useSettingsStore} from '@/stores/settings'

interface IOptionsIndex {
  _tab: number
  _tabs: Array<{ title: string, id: string }>
  _themeKeys: string[]
  _themeNames: { [p: string]: string }
  _serviceKeys: string[]
  _indexesA: string[]
  _indexesB: string[]
  _materialsA: string[]
  _materialsB: string[]
}

const {rt, t, tm} = useI18n()
const theme = useTheme()
const {CONS, log} = useAppApi()
const settings = useSettingsStore()
const {_service, _skin, _exchanges, _indexes, _markets, _materials} = storeToRefs(settings)

const indexes_keys_a = []
const indexes_keys_b = []
const indexes_keys = Object.keys(CONS.SETTINGS.INDEXES)
for (let i = 0; i < indexes_keys.length; i++) {
  if (i < indexes_keys.length / 2) {
    indexes_keys_a.push(indexes_keys[i])
  } else {
    indexes_keys_b.push(indexes_keys[i])
  }
}

const materials_keys_a = []
const materials_keys_b = []
const materials_keys = Object.keys(CONS.SETTINGS.MATERIALS)
for (let i = 0; i < materials_keys.length; i++) {
  if (i < materials_keys.length / 2) {
    materials_keys_a.push(materials_keys[i])
  } else {
    materials_keys_b.push(materials_keys[i])
  }
}

const service_keys = []
const all_service_keys = Object.keys(CONS.SERVICES)
for (let i = 0; i < all_service_keys.length - 2; i++) {
  service_keys.push(all_service_keys[i])
}

const state: IOptionsIndex = reactive({
  _tab: 0,
  _tabs: tm('optionsPage.tabs'),
  _themeKeys: Object.keys(theme.themes.value),
  _themeNames: tm(`optionsPage.themeNames`),
  _serviceKeys: service_keys,
  _indexesA: indexes_keys_a,
  _indexesB: indexes_keys_b,
  _materialsA: materials_keys_a,
  _materialsB: materials_keys_b
})

const optionsMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__OPTIONS})
const onResponse = (m: object): void => {
  switch (Object.values(m)[0]) {
    case CONS.MESSAGES.STORES__INIT_SETTINGS__RESPONSE:
      log('OPTIONS_INDEX: onResponse', {info: Object.values(m)[1]})
      settings.initStore(theme, Object.values(m)[1])
      break
    default:
  }
}
// listen for backend responses
optionsMessagePort.onMessage.addListener(onResponse)
optionsMessagePort.postMessage({type: CONS.MESSAGES.STORES__INIT_SETTINGS})

const setIndexes = (): void => {
  const optionsMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__OPTIONS})
  optionsMessagePort.postMessage({type: CONS.MESSAGES.OPTIONS__SET_INDEXES, data: toRaw(settings.indexes)})
}

const setMaterials = (): void => {
  const optionsMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__OPTIONS})
  optionsMessagePort.postMessage({type: CONS.MESSAGES.OPTIONS__SET_MATERIALS, data: toRaw(settings.materials)})
}

const setSkin = (ev: Event): void => {
  const appMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__APP})
  //const optionsMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__OPTIONS})
  if (ev.target instanceof HTMLInputElement) {
    console.error('DSFSFDFSFFFDSFS----------------', ev.target.value)
    //theme.global.name.value = ev.target.value
    appMessagePort.postMessage({type: CONS.MESSAGES.OPTIONS__SET_SKIN, data: ev.target.value})
  }
}

const setService = (ev: Event): void => {
  const optionsMessagePort = browser.runtime.connect({name: CONS.MESSAGES.PORT__OPTIONS})
  if (ev.target instanceof HTMLInputElement) {
    optionsMessagePort.postMessage({type: CONS.MESSAGES.OPTIONS__SET_SERVICE, data: ev.target.value})
  }
}

log('--- OptionsIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app v-bind:flat="true">
    <v-main>
      <v-container>
        <v-tabs v-model="state._tab" show-arrows>
          <v-tab v-for="(item, i) in state._tabs" v-bind:key="item.id" v-bind:value="i">
            {{ rt(item.title) }}
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="state._tab" class="pa-5">
          <v-tabs-window-item v-bind:value="0">
            <v-row>
              <v-col cols="12" md="6" sm="6">
                <v-radio-group v-model="_skin" column>
                  <v-radio
                    v-for="item in state._themeKeys"
                    v-bind:key="item"
                    v-bind:label="rt(state._themeNames[item])"
                    v-bind:value="item"
                    v-on:click="setSkin"
                  ></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="6" sm="6">
                <v-radio-group v-model="_service" column>
                  <v-radio
                    v-for="item in state._serviceKeys"
                    v-bind:key="item"
                    v-bind:label="CONS.SERVICES[item].NAME ?? ''"
                    v-bind:value="item"
                    v-on:click="setService"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item v-bind:value="1">
            <v-row class="pa-10" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList
                  v-bind:_label="t('optionsPage.markets.label')"
                  v-bind:_list="_markets"
                  v-bind:_tab="CONS.SETTINGS.MARKETS_TAB"
                  v-bind:_title="t('optionsPage.markets.title')"
                  v-bind:_port="optionsMessagePort"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item v-bind:value="2">
            <v-row>
              <v-col>
                <v-checkbox
                  v-for="item in state._indexesA"
                  v-bind:key="item"
                  v-model="_indexes"
                  hide-details
                  v-bind:label="CONS.SETTINGS.INDEXES[item]"
                  v-bind:value="item"
                  v-on:change="setIndexes"
                ></v-checkbox>
              </v-col>
              <v-col>
                <v-checkbox
                  v-for="item in state._indexesB"
                  v-bind:key="item"
                  v-model="_indexes"
                  hide-details
                  v-bind:label="CONS.SETTINGS.INDEXES[item]"
                  v-bind:value="item"
                  v-on:change="setIndexes"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item v-bind:value="3">
            <v-row>
              <v-col>
                <v-checkbox
                  v-for="item in state._materialsA"
                  v-bind:key="item"
                  v-model="_materials"
                  hide-details
                  v-bind:label="rt(tm('optionsPage.materials')[item])"
                  v-bind:value="item"
                  v-on:change="setMaterials"
                ></v-checkbox>
              </v-col>
              <v-col>
                <v-checkbox
                  v-for="item in state._materialsB"
                  v-bind:key="item"
                  v-model="_materials"
                  hide-details
                  v-bind:label="rt(tm('optionsPage.materials')[item])"
                  v-bind:value="item"
                  v-on:change="setMaterials"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item v-bind:value="4">
            <v-row class="pa-12" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList
                  v-bind:_label="t('optionsPage.exchanges.label')"
                  v-bind:_list="_exchanges"
                  v-bind:_tab="CONS.SETTINGS.EXCHANGES_TAB"
                  v-bind:_title="t('optionsPage.exchanges.title')"
                  v-bind:_toUpperCase="true"
                  v-bind:_port="optionsMessagePort"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>
