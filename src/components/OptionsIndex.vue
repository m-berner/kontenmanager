<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {type Ref, ref} from 'vue'
import {useApp} from '@/composables/useApp'
import DynamicList from '@/components/_options/DynamicList.vue'
import ThemeSelector from '@/components/_options/ThemeSelector.vue'
import ServiceSelector from '@/components/_options/ServiceSelector.vue'
import CheckboxGrid from '@/components/_options/CheckboxGrid.vue'

interface ITabs {
  title: string,
  id: string
}

const {rt, t} = useI18n()
const {CONS, log} = useApp()

const tab: Ref<number> = ref(0)
const optionsTabs: ITabs[] = [
  {
    title: t('optionsPage.tabs.ge'),
    id: 'register_ge'
  },
  {
    title: t('optionsPage.tabs.mp'),
    id: 'register_mp'
  },
  {
    title: t('optionsPage.tabs.ind'),
    id: 'register_ind'
  },
  {
    title: t('optionsPage.tabs.mat'),
    id: 'register_mat'
  },
  {
    title: t('optionsPage.tabs.ex'),
    id: 'register_ex'
  }
]

log('--- OptionsIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app flat>
    <v-main>
      <v-container>
        <v-tabs v-model="tab" show-arrows>
          <v-tab v-for="(item, index) in optionsTabs" :key="item.id" :value="index">
            {{ rt(item.title) }}
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab" class="pa-5">
          <v-tabs-window-item :value="0">
            <v-row>
              <v-col cols="12" md="6" sm="6">
                <ThemeSelector />
              </v-col>
              <v-col cols="12" md="6" sm="6">
                <ServiceSelector />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="1">
            <v-row class="pa-10" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList
                    :type="CONS.DYNAMIC_LIST.TYPES.MARKETS"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <v-row>
                <CheckboxGrid
                  :type = "CONS.CHECKBOX_GRID.TYPES.INDEXES"
                ></CheckboxGrid>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="3">
            <v-row>
              <CheckboxGrid
                  :type = "CONS.CHECKBOX_GRID.TYPES.MATERIALS"
              ></CheckboxGrid>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="4">
            <v-row class="pa-12" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList
                    :type="CONS.DYNAMIC_LIST.TYPES.EXCHANGES"
                ></DynamicList>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>
