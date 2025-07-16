<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/pages/background'

interface IContent {
  title: string
  subtitle: string
  content: string
  icon: string
}

const {rt, t, tm} = useI18n()
const {log} = useApp()

log('--- HelpContent.vue setup ---')
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <v-row justify="center">
        <v-col cols="8" s="8">
          <v-card color="secondary">
            <v-card-title>
              {{ t('helpContent.requestsTitle') }}
            </v-card-title>
          </v-card>
          <v-card v-for="item in tm('helpContent.requests').map((entry: IContent): IContent => {
            return {
              title: rt(entry.title),
              subtitle: '',
              content: rt(entry.content),
              icon: rt(entry.icon)
            }
          })" v-bind:key="rt(item.title)">
            <v-card-title>
              <v-icon v-if="rt(item.icon).length > 0">{{ rt(item.icon) }}</v-icon>
              {{ rt(item.title) }}
            </v-card-title>
            <v-card-text>
              {{ rt(item.content) }}
            </v-card-text>
          </v-card>
          <v-card color="secondary">
            <v-card-title>
              {{ t('helpContent.toolBarTitle') }}
            </v-card-title>
          </v-card>
          <v-card v-for="item in tm('helpContent.toolBar').map((entry: IContent): IContent => {
            return {
              title: rt(entry.title),
              content: rt(entry.content),
              subtitle: '',
              icon: rt(entry.icon)
            }
          })" v-bind:key="rt(item.title)">
            <v-card-title>
              <v-icon v-if="rt(item.icon).length > 0">{{ rt(item.icon) }}</v-icon>
              {{ rt(item.title) }}
            </v-card-title>
            <v-card-text>
              {{ rt(item.content) }}
            </v-card-text>
          </v-card>
          <v-card color="secondary">
            <v-card-title>
              {{ t('helpContent.companyBarTitle') }}
            </v-card-title>
          </v-card>
          <v-card v-for="item in tm('helpContent.companyBar').map((entry: IContent): IContent => {
            return {
              title: rt(entry.title),
              content: '',
              subtitle: rt(entry.subtitle),
              icon: rt(entry.icon)
            }
          })" v-bind:key="rt(item.title)">
            <v-card-title>
              <v-icon v-if="rt(item.icon).length > 0">{{ rt(item.icon) }}</v-icon>
              {{ rt(item.title) }}
            </v-card-title>
            <v-card-text>
              {{ rt(item.subtitle) }}
            </v-card-text>
          </v-card>
          <v-card color="secondary">
            <v-card-title>
              {{ t('helpContent.transferBarTitle') }}
            </v-card-title>
          </v-card>
          <v-card v-for="item in tm('helpContent.transferBar').map((entry: IContent): IContent => {
            return {
              title: rt(entry.title),
              content: '',
              subtitle: rt(entry.subtitle),
              icon: rt(entry.icon)
            }
          })" v-bind:key="rt(item.title)">
            <v-card-title>
              <v-icon v-if="rt(item.icon).length > 0">{{ rt(item.icon) }}</v-icon>
              {{ rt(item.title) }}
            </v-card-title>
            <v-card-text>
              {{ rt(item.subtitle) }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<style scoped>
.sheet {
  overflow: auto;
  height: calc(100vh - 300px);
}
</style>
