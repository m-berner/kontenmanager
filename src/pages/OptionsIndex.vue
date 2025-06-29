<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useTheme} from 'vuetify'
import {onBeforeMount, type Reactive, reactive} from 'vue'
import {useAppApi} from '@/pages/background'
import DynamicList from '@/components/helper/DynamicList.vue'

interface IOptionsIndex {
  _tab: number
  _tabs: Array<{ title: string, id: string }>
  _skin: string
  _service: string
  _exchanges: string[]
  _indexes: string[]
  _markets: string[]
  _materials: string[]
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

const state: Reactive<IOptionsIndex> = reactive({
  _tab: 0,
  _tabs: tm('optionsPage.tabs'),
  _skin: '',
  _service: '',
  _exchanges: [],
  _indexes: [],
  _markets: [],
  _materials: [],
  _themeKeys: Object.keys(theme.themes.value),
  _themeNames: tm(`optionsPage.themeNames`),
  _serviceKeys: service_keys,
  _indexesA: indexes_keys_a,
  _indexesB: indexes_keys_b,
  _materialsA: materials_keys_a,
  _materialsB: materials_keys_b
})

const setIndexes = async (): Promise<void> => {
  await browser.storage.local.set({sIndexes: state._indexes})
}
const setMaterials = async (): Promise<void> => {
  await browser.storage.local.set({sMaterials: state._materials})
}
const setSkin = async (ev: Event): Promise<void> => {
  if (ev.target instanceof HTMLInputElement) {
    theme.global.name.value = ev.target.value
    await browser.storage.local.set({sSkin: ev.target.value})
  }
}
const setService = async (ev: Event): Promise<void> => {
  if (ev.target instanceof HTMLInputElement) {
    await browser.storage.local.set({sService: ev.target.value})
  }
}

onBeforeMount(async (): Promise<void> => {
  const initSettingsResponse = await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.OPTIONS__INIT_SETTINGS}))
  const initSettings = JSON.parse(initSettingsResponse).data
  state._skin = initSettings.sSkin
  state._service = initSettings.sService
  state._indexes = initSettings.sIndexes
  state._materials = initSettings.sMaterials
  state._markets = initSettings.sMarkets
  state._exchanges = initSettings.sExchanges
})

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
                <v-radio-group v-model="state._skin" column>
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
                <v-radio-group v-model="state._service" column>
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
                  v-bind:_list="state._markets"
                  v-bind:_tab="CONS.SETTINGS.MARKETS_TAB"
                  v-bind:_title="t('optionsPage.markets.title')"
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
                  v-model="state._indexes"
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
                  v-model="state._indexes"
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
                  v-model="state._materials"
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
                  v-model="state._materials"
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
                  v-bind:_list="state._exchanges"
                  v-bind:_tab="CONS.SETTINGS.EXCHANGES_TAB"
                  v-bind:_title="t('optionsPage.exchanges.title')"
                  v-bind:_toUpperCase="true"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>
