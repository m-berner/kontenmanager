<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAppConfig} from '@/composables/useAppConfig'

const {log} = useApp()
const {BROWSER_STORAGE, SERVICES} = useAppConfig()
const {getStorage, setStorage} = useBrowser()

const service = ref<string>(BROWSER_STORAGE.SERVICE.value)

const setService = async (): Promise<void> => {
    log('SERVICE_SELECTOR: setService')
    await setStorage(BROWSER_STORAGE.SERVICE.key, service.value)
}

const serviceLabels = (item: string): string => {
    const service = SERVICES.MAP.get(item)
    if (service !== undefined && service?.NAME !== undefined) {
        return service.NAME
    } else {
        return 'Label not found'
    }
}

onBeforeMount(async () => {
    log('SERVICE_SELECTOR: onBeforeMount')
    const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key])
    service.value = storageService[BROWSER_STORAGE.SERVICE.key] as string
})

log('--- ServiceSelector.vue setup ---')
</script>

<template>
    <v-radio-group
        v-model="service"
        column
        @update:model-value="async () => {await setService()}">
        <v-radio
            v-for="item in [...SERVICES.MAP.keys()]"
            :key="item"
            :label="serviceLabels(item)"
            :value="item"
        />
    </v-radio-group>
</template>
