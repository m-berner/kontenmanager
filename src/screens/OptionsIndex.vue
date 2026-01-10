<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import DynamicList from '@/components/DynamicList.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import ServiceSelector from '@/components/ServiceSelector.vue'
import CheckboxGrid from '@/components/CheckboxGrid.vue'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {COMPONENTS} = useAppConfig()

const TABS = [
    {
        title: t('screens.optionsIndex.tabs.ge'),
        id: 'register_ge'
    },
    {
        title: t('screens.optionsIndex.tabs.mp'),
        id: 'register_mp'
    },
    {
        title: t('screens.optionsIndex.tabs.ind'),
        id: 'register_ind'
    },
    {
        title: t('screens.optionsIndex.tabs.mat'),
        id: 'register_mat'
    },
    {
        title: t('screens.optionsIndex.tabs.ex'),
        id: 'register_ex'
    }
]

const tab = ref<number>(0)

log('--- OptionsIndex.vue setup ---', window.location.href, 'info')
</script>

<template>
    <v-app flat>
        <v-main>
            <v-container>
                <v-tabs v-model="tab" show-arrows>
                    <v-tab v-for="(item, index) in TABS" :key="item.id" :value="index">
                        {{ item.title }}
                    </v-tab>
                </v-tabs>
                <v-tabs-window v-model="tab" class="pa-5">
                    <v-tabs-window-item :value="0">
                        <v-row>
                            <v-col cols="12" md="6" sm="6">
                                <ThemeSelector/>
                            </v-col>
                            <v-col cols="12" md="6" sm="6">
                                <ServiceSelector/>
                            </v-col>
                        </v-row>
                    </v-tabs-window-item>
                    <v-tabs-window-item :value="1">
                        <v-row class="pa-10" justify="center">
                            <v-col cols="12" md="10" sm="10">
                                <DynamicList
                                    :type="COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS"
                                />
                            </v-col>
                        </v-row>
                    </v-tabs-window-item>
                    <v-tabs-window-item :value="2">
                        <v-row>
                            <CheckboxGrid
                                :type="COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES"
                            />
                        </v-row>
                    </v-tabs-window-item>
                    <v-tabs-window-item :value="3">
                        <v-row>
                            <CheckboxGrid
                                :type="COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS"
                            />
                        </v-row>
                    </v-tabs-window-item>
                    <v-tabs-window-item :value="4">
                        <v-row class="pa-12" justify="center">
                            <v-col cols="12" md="10" sm="10">
                                <DynamicList
                                    :type="COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES"
                                />
                            </v-col>
                        </v-row>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-container>
        </v-main>
    </v-app>
</template>
