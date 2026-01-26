<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {UtilsService} from '@/domains/utils'
import {STORES} from '@/config/stores'

const {n, t} = useI18n()
const runtime = useRuntimeStore()
const {curUsd, infoMaterials} = storeToRefs(runtime)
const settings = useSettingsStore()

// Compute values once
const materialValues = computed(() => {
    const result = new Map<string, { usd: number, local: number }>()

    for (const item of settings.materials) {
        const code = STORES.MATERIALS.get(item) ?? ''
        const usdValue = infoMaterials.value.get(code) ?? 0
        const localValue = usdValue / curUsd.value

        result.set(item, {usd: usdValue, local: localValue})
    }

    return result
})

UtilsService.log('--- views/InfoBar.vue setup ---')
</script>

<template>
    <v-app-bar app color="secondary" flat>
        <v-list bg-color="secondary" class="horizontal-list" lines="two">
            <v-list-item v-for="item in settings.exchanges" :key="item">
                <v-list-item-title>{{ item }}</v-list-item-title>
                <v-list-item-subtitle>{{ n(runtime.infoExchanges.get(item) ?? 1, 'decimal3') }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-for="item in settings.indexes" :key="item">
                <v-list-item-title>{{ STORES.INDEXES.get(item) }}</v-list-item-title>
                <v-list-item-subtitle>{{ n(runtime.infoIndexes.get(item) ?? 0, 'integer') }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-for="item in settings.materials" :key="item">
                <v-list-item-title>{{ t('views.optionsIndex.materials.' + item) }}</v-list-item-title>
                <v-list-item-subtitle>
                    {{
                        n(materialValues.get(item)!.usd, 'currencyUSD') + ' / ' + n(materialValues.get(item)!.local, 'currency')
                    }}
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
