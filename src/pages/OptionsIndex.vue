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

type ITabs = { title: string, id: string }

interface IOptionsIndex {
  tab: number
  tabs: ITabs[]
  skin: string
  service: string
  exchanges: string[]
  indexes: string[]
  markets: string[]
  materials: string[]
  themeKeys: string[]
  themeNames: { [p: string]: string }
  serviceKeys: string[]
  indexesA: string[]
  indexesB: string[]
  materialsA: string[]
  materialsB: string[]
}

const {rt, t, tm} = useI18n()
const theme = useTheme()
const {CONS, log} = useAppApi()

const indexesKeysA: string[] = []
const indexesKeysB: string[] = []
const indexesKeys = Object.keys(CONS.SETTINGS.INDEXES)
for (let i = 0; i < indexesKeys.length; i++) {
  if (i < indexesKeys.length / 2) {
    indexesKeysA.push(indexesKeys[i])
  } else {
    indexesKeysB.push(indexesKeys[i])
  }
}

const materialsKeysA: string[] = []
const materialsKeysB: string[] = []
const materialsKeys = Object.keys(CONS.SETTINGS.MATERIALS)
for (let i = 0; i < materialsKeys.length; i++) {
  if (i < materialsKeys.length / 2) {
    materialsKeysA.push(materialsKeys[i])
  } else {
    materialsKeysB.push(materialsKeys[i])
  }
}

const serviceKeys: string[] = []
const allServiceKeys = Object.keys(CONS.SERVICES)
for (let i = 0; i < allServiceKeys.length - 2; i++) {
  serviceKeys.push(allServiceKeys[i])
}

// noinspection TypeScriptValidateTypes
const state: Reactive<IOptionsIndex> = reactive<IOptionsIndex>({
  tab: 0,
  tabs: tm('optionsPage.tabs'),
  skin: '',
  service: '',
  exchanges: [],
  indexes: [],
  markets: [],
  materials: [],
  themeKeys: Object.keys(theme.themes.value),
  themeNames: tm(`optionsPage.themeNames`),
  serviceKeys: serviceKeys,
  indexesA: indexesKeysA,
  indexesB: indexesKeysB,
  materialsA: materialsKeysA,
  materialsB: materialsKeysB
})

const setIndexes = async (): Promise<void> => {
  await browser.storage.local.set({[CONS.STORAGE.PROPS.INDEXES]: state.indexes})
}
const setMaterials = async (): Promise<void> => {
  await browser.storage.local.set({[CONS.STORAGE.PROPS.MATERIALS]: state.materials})
}
const setSkin = async (ev: Event): Promise<void> => {
  if (ev.target instanceof HTMLInputElement) {
    theme.global.name.value = ev.target.value
    await browser.storage.local.set({[CONS.STORAGE.PROPS.SKIN]: ev.target.value})
  }
}
const setService = async (ev: Event): Promise<void> => {
  if (ev.target instanceof HTMLInputElement) {
    await browser.storage.local.set({[CONS.STORAGE.PROPS.SERVICE]: ev.target.value})
  }
}

const serviceLabels = (item: string) => {
  const service = CONS.SERVICES.MAP.get(item)
  if (service !== undefined) {
    return service.NAME
  } else {
    return 'Label not found'
  }
}

onBeforeMount(async (): Promise<void> => {
  const storageResponseString = await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.STORAGE__GET_ALL}))
  const storageResponseData = JSON.parse(storageResponseString).data
  state.skin = storageResponseData[CONS.STORAGE.PROPS.SKIN]
  state.service = storageResponseData[CONS.STORAGE.PROPS.SERVICE]
  state.indexes = storageResponseData[CONS.STORAGE.PROPS.INDEXES]
  state.materials = storageResponseData[CONS.STORAGE.PROPS.MATERIALS]
  state.markets = storageResponseData[CONS.STORAGE.PROPS.MARKETS]
  state.exchanges = storageResponseData[CONS.STORAGE.PROPS.EXCHANGES]
})

log('--- OptionsIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app v-bind:flat="true">
    <v-main>
      <v-container>
        <v-tabs v-model="state.tab" show-arrows>
          <v-tab v-for="(item, i) in state.tabs" v-bind:key="item.id" v-bind:value="i">
            {{ rt(item.title) }}
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="state.tab" class="pa-5">
          <v-tabs-window-item v-bind:value="0">
            <v-row>
              <v-col cols="12" md="6" sm="6">
                <v-radio-group v-model="state.skin" column>
                  <v-radio
                    v-for="item in state.themeKeys"
                    v-bind:key="item"
                    v-bind:label="rt(state.themeNames[item])"
                    v-bind:value="item"
                    v-on:click="setSkin"
                  ></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="6" sm="6">
                <v-radio-group v-model="state.service" column>
                  <v-radio
                    v-for="item in state.serviceKeys"
                    v-bind:key="item"
                    v-bind:label="serviceLabels(item)"
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
                  v-bind:label="t('optionsPage.markets.label')"
                  v-bind:list="state.markets"
                  v-bind:type="CONS.DYNAMIC_LIST.TYPES.MARKETS"
                  v-bind:title="t('optionsPage.markets.title')"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item v-bind:value="2">
            <v-row>
              <v-col>
                <v-checkbox
                  v-for="item in state.indexesA"
                  v-bind:key="item"
                  v-model="state.indexes"
                  hide-details
                  v-bind:label="CONS.SETTINGS.INDEXES[item]"
                  v-bind:value="item"
                  v-on:change="setIndexes"
                ></v-checkbox>
              </v-col>
              <v-col>
                <v-checkbox
                  v-for="item in state.indexesB"
                  v-bind:key="item"
                  v-model="state.indexes"
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
                <!--suppress TypeScriptValidateTypes -->
                <v-checkbox
                  v-for="item in state.materialsA"
                  v-bind:key="item"
                  v-model="state.materials"
                  hide-details
                  v-bind:label="rt(tm('optionsPage.materials')[item])"
                  v-bind:value="item"
                  v-on:change="setMaterials"
                ></v-checkbox>
              </v-col>
              <v-col>
                <!--suppress TypeScriptValidateTypes -->
                <v-checkbox
                  v-for="item in state.materialsB"
                  v-bind:key="item"
                  v-model="state.materials"
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
                  v-bind:label="t('optionsPage.exchanges.label')"
                  v-bind:list="state.exchanges"
                  v-bind:type="CONS.DYNAMIC_LIST.TYPES.EXCHANGES"
                  v-bind:title="t('optionsPage.exchanges.title')"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>
