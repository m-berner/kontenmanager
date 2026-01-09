<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Dynamic_List_Props, I_Exchange_Data} from '@/types'
import {computed, defineProps, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'
import {useAppConfig} from '@/composables/useAppConfig'

const props = defineProps<I_Dynamic_List_Props>()
const {t} = useI18n()
const {log} = useApp()
const {BROWSER_STORAGE, COMPONENTS} = useAppConfig()
const {getStorage, setStorage} = useBrowser()
const {fetchExchangesData} = useFetch()

const newItem = ref<string>('')
const list = ref<string[]>([])

const isLoading = ref<boolean>(false)
const isAdding = ref<boolean>(false)
const error = ref<string | null>(null)

const label = computed<string>(() => {
    let resultLabel = 'Error'
    switch (props.type) {
        case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
            resultLabel = t('screens.optionsIndex.exchanges.label')
            break
        case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
            resultLabel = t('screens.optionsIndex.markets.label')
            break
        default:
    }
    return resultLabel
})
const title = computed<string>(() => {
    let resultTitle = 'Error'
    switch (props.type) {
        case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
            resultTitle = t('screens.optionsIndex.exchanges.title')
            break
        case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
            resultTitle = t('screens.optionsIndex.markets.title')
            break
        default:
    }
    return resultTitle
})

const addItem = async (item: string): Promise<void> => {
    log('DYNAMIC_LIST: addItem')
    if (!item.trim()) return  // Validate input

    isAdding.value = true  // Start loading
    error.value = null  // Clear previous errors
    try {
        const runtime = useRuntimeStore()
        const {infoExchanges} = storeToRefs(runtime)
        const settings = useSettingsStore()
        const {exchanges, markets} = storeToRefs(settings)
        if (!list.value?.includes(item)) {
            switch (props.type) {
                case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                    list.value.push(item)
                    markets.value.push(item)
                    await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value])
                    break
                case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                    list.value.push(item.toUpperCase())
                    exchanges.value.push(item.toUpperCase())
                    await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value])
                    const exchangesInfoData: I_Exchange_Data[] = await fetchExchangesData([newItem.value])
                    infoExchanges.value.set(exchanges.value[exchanges.value.length - 1], exchangesInfoData[0].value)
                    break
                default:
            }
            newItem.value = ''
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to add item'
        log('DYNAMIC_LIST: addItem error', {error: err})
    } finally {
        isAdding.value = false  // Stop loading
    }
}

const removeItem = async (n: number): Promise<void> => {
    log('DYNAMIC_LIST: removeItem')
    if (n < 0) return

    error.value = null

    try {
        list.value.splice(n, 1)
        newItem.value = ''
        switch (props.type) {
            case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value])
                break
            case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value])
                break
            default:
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to remove item'
        log('DYNAMIC_LIST: removeItem error', {error: err})
    }
}

onBeforeMount(async () => {
    log('DYNAMIC_LIST: onBeforeMount')
    isLoading.value = true
    error.value = null

    try {
        const storage = await getStorage([BROWSER_STORAGE.MARKETS.key, BROWSER_STORAGE.EXCHANGES.key])
        switch (props.type) {
            case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                list.value = storage[BROWSER_STORAGE.EXCHANGES.key] as string[]
                break
            case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                list.value = storage[BROWSER_STORAGE.MARKETS.key] as string[]
                break
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load data'
        log('DYNAMIC_LIST: onBeforeMount error', {error: err})
    } finally {
        isLoading.value = false
    }
})

log('--- DynamicList.vue setup ---')
</script>

<template>
    <v-card :title="title" color="secondary">
        <!-- Loading State -->
        <v-card-text v-if="isLoading" class="text-center">
            <v-progress-circular
                color="primary"
                indeterminate
            />
            <p class="mt-3">Loading...</p>
        </v-card-text>

        <!-- Error State -->
        <v-alert
            v-if="error && !isLoading"
            class="ma-4"
            dismissible
            type="error"
            @click:close="error = null"
        >
            {{ error }}
        </v-alert>

        <!-- Content State -->
        <template v-if="!isLoading">
            <v-list bg-color="secondary">
                <v-list-item
                    v-for="(item, i) in list"
                    :key="item"
                    :title="item"
                    hide-details
                >
                    <template v-slot:prepend>
                        <v-btn
                            :disabled="isAdding"
                            class="mr-3"
                            icon="$close"
                            @click="removeItem(i)"
                        />
                    </template>
                </v-list-item>

                <!-- Empty State -->
                <v-list-item v-if="list.length === 0">
                    <v-list-item-title class="text-center text-grey">
                        No items yet. Add one below.
                    </v-list-item-title>
                </v-list-item>
            </v-list>

            <v-card-actions>
                <v-text-field
                    v-model="newItem"
                    :autofocus="true"
                    :clearable="true"
                    :disabled="isAdding"
                    :label="label"
                    :placeholder="props.placeholder"
                    type="text"
                >
                    <template v-slot:append>
                        <v-btn
                            :disabled="!newItem.trim() || isAdding"
                            :loading="isAdding"
                            class="ml-3"
                            color="primary"
                            icon="$add"
                            @click="addItem(newItem)"
                        />
                    </template>
                </v-text-field>
            </v-card-actions>
        </template>
    </v-card>
</template>
