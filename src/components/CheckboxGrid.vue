<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineProps, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import type {I_Checkbox_Grid_Props} from '@/types'

const props = defineProps<I_Checkbox_Grid_Props>()
const {t} = useI18n()
const {CONS, log} = useApp()
const {getStorage, setStorage} = useBrowser()

const T = Object.freeze<{ STRINGS: Record<string, string> }>({
                                                                 STRINGS: {
                                                                     au: t('optionsIndex.materials.au'),
                                                                     ag: t('optionsIndex.materials.ag'),
                                                                     brent: t('optionsIndex.materials.brent'),
                                                                     wti: t('optionsIndex.materials.wti'),
                                                                     cu: t('optionsIndex.materials.cu'),
                                                                     pt: t('optionsIndex.materials.pt'),
                                                                     al: t('optionsIndex.materials.al'),
                                                                     ni: t('optionsIndex.materials.ni'),
                                                                     sn: t('optionsIndex.materials.sn'),
                                                                     pb: t('optionsIndex.materials.pb'),
                                                                     pd: t('optionsIndex.materials.pd')
                                                                 }
                                                             })

const checked = ref<string[]>([])
const isLoading = ref<boolean>(true)
const isSaving = ref<boolean>(false)
const error = ref<string | null>(null)

const boxes = computed((): { A: string[], B: string[] } => {
    const indexesKeys: string[] = Array.from(CONS.SETTINGS.INDEXES.keys())
    const materialsKeys: string[] = Array.from(CONS.SETTINGS.MATERIALS.keys())
    let resultBoxes: { A: string[], B: string[] } = {A: [], B: []}
    switch (props.type) {
        case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
            resultBoxes = {
                A: indexesKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.INDEXES.size / 2),
                B: indexesKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.INDEXES.size / 2)
            }
            break
        case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
            resultBoxes = {
                A: materialsKeys.filter((_key: string, index: number) => index < CONS.SETTINGS.MATERIALS.size / 2),
                B: materialsKeys.filter((_key: string, index: number) => index >= CONS.SETTINGS.MATERIALS.size / 2)
            }
            break
    }
    return resultBoxes
})

const setLabel = (item: string, labels: Record<string, string>): string | undefined => {
    let resultLabel: string | undefined = ''
    switch (props.type) {
        case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
            resultLabel = CONS.SETTINGS.INDEXES.get(item)
            break
        case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
            resultLabel = labels[item]
            break
    }
    return resultLabel
}

const setChecked = async (): Promise<void> => {
    isSaving.value = true
    error.value = null

    try {
        const checkedBoxes = checked.value
        switch (props.type) {
            case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
                await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES, [...checkedBoxes])
                break
            case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
                await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS, [...checkedBoxes])
                break
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to save selection'
        log('CHECKBOX_GRID: setChecked error', {error: err})
    } finally {
        isSaving.value = false
    }
}

onBeforeMount(async () => {
    log('CHECKBOX_GRID: onBeforeMount')
    isLoading.value = true
    error.value = null

    try {
        const storage = await getStorage([
                                             CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES,
                                             CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS
                                         ])

        switch (props.type) {
            case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
                checked.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES] as string[]
                break
            case CONS.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
                checked.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS] as string[]
                break
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load selections'
        log('CHECKBOX_GRID: onBeforeMount error', {error: err})
    } finally {
        isLoading.value = false
    }
})

log('--- CheckboxGrid.vue setup ---')
</script>

<template>
    <!-- Loading State -->
    <v-col v-if="isLoading" class="text-center" cols="12">
        <v-progress-circular
            color="primary"
            indeterminate
        />
        <p class="mt-3">Loading options...</p>
    </v-col>

    <!-- Error State -->
    <v-col v-if="error && !isLoading" cols="12">
        <v-alert
            dismissible
            type="error"
            @click:close="error = null"
        >
            {{ error }}
        </v-alert>
    </v-col>

    <!-- Content State with Saving Indicator -->
    <template v-if="!isLoading">
        <v-col :class="{ 'opacity-50': isSaving }">
            <v-checkbox
                v-for="item in boxes.A"
                :key="item"
                v-model="checked"
                :disabled="isSaving"
                :label="setLabel(item, T.STRINGS)"
                :value="item"
                hide-details
                @change="setChecked"
            />
        </v-col>
        <v-col :class="{ 'opacity-50': isSaving }">
            <v-checkbox
                v-for="item in boxes.B"
                :key="item"
                v-model="checked"
                :disabled="isSaving"
                :label="setLabel(item, T.STRINGS)"
                :value="item"
                hide-details
                @change="setChecked"
            />
        </v-col>

        <!-- Optional: Saving indicator -->
        <v-col v-if="isSaving" class="text-center" cols="12">
            <v-chip color="primary" size="small">
                <v-progress-circular
                    class="mr-2"
                    indeterminate
                    size="16"
                    width="2"
                />
                Saving...
            </v-chip>
        </v-col>
    </template>
</template>

<style scoped>
.opacity-50 {
    opacity: 0.5;
    pointer-events: none;
}
</style>
