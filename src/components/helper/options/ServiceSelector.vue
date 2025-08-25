<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useApp} from '@/composables/useApp'
import {onBeforeMount, type Ref, ref} from 'vue'

const {CONS, log} = useApp()

const service: Ref<string> = ref('goyax') //  TODO default...

const setService = async (service: string | null): Promise<void> => {
  if (service !== null) {
    await browser.storage.local.set({[CONS.STORAGE.PROPS.SERVICE]: service})
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
  const storageService = await browser.storage.local.get([CONS.STORAGE.PROPS.SERVICE])
  service.value = storageService[CONS.STORAGE.PROPS.SERVICE]
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
    ></v-radio>
  </v-radio-group>
</template>
