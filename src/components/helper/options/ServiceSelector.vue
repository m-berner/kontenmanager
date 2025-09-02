<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'

const {CONS} = useConstant()
const {log} = useNotification()
const {getStorage, setStorage} = useBrowser()

const service = ref('goyax') //  TODO default...

const setService = async (service: string | null): Promise<void> => {
  if (service !== null) {
    await setStorage(CONS.STORAGE.PROPS.SERVICE, service)
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
  const storageService = await getStorage([CONS.STORAGE.PROPS.SERVICE])
  service.value = storageService[CONS.STORAGE.PROPS.SERVICE] as string
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
