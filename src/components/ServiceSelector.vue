<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {useTheme} from 'vuetify'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'

const {CONS, log} = useApp()
const {getStorage, setStorage} = useBrowser()
const theme = useTheme()

const service = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SKIN)

const setService = async (service: string | null): Promise<void> => {
  if (service !== null) {
    theme.global.name.value = service
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE, service)
  }
}

const serviceLabels = (item: string): string => {
  const service = CONS.SERVICES.MAP.get(item)
  if (service !== undefined && service?.NAME !== undefined) {
    return service.NAME
  } else {
    return 'Label not found'
  }
}

onBeforeMount(async () => {
  log('SERVICE_SELECTOR: onBeforeMounted')
  const storageService = await getStorage([CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE])
  service.value = storageService[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE] as string
})

log('--- ServiceSelector.vue setup ---')
</script>

<template>
  <v-radio-group
      v-model="service"
      column
      @update:modelValue="setService">
    <v-radio
        v-for="item in [...CONS.SERVICES.MAP.keys()]"
        :key="item"
        :label="serviceLabels(item)"
        :value="item"
    />
  </v-radio-group>
</template>
