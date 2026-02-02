<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { BROWSER_STORAGE } from "@/config/storage";
import { FETCH } from "@/config/fetch";
import { useUserInfo } from "@/composables/useUserInfo";

const { getStorage, setStorage } = useStorage();
const { handleUserInfo } = useUserInfo();

const service = ref<string>(BROWSER_STORAGE.SERVICE.value);

const setService = async (): Promise<void> => {
  DomainUtils.log("SERVICE_SELECTOR: setService");
  await setStorage(BROWSER_STORAGE.SERVICE.key, service.value);
};

const serviceLabels = (item: string): string => {
  const service = FETCH.MAP.get(item);
  if (service !== undefined && service?.NAME !== undefined) {
    return service.NAME;
  } else {
    return "Label not found";
  }
};

onBeforeMount(async () => {
  DomainUtils.log("SERVICE_SELECTOR: onBeforeMount");
  const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
  service.value = storageService[BROWSER_STORAGE.SERVICE.key] as string;
});

handleUserInfo("console", "ServiceSelector", "--- vue setup ---", {
  logLevel: "log"
});
</script>

<template>
  <v-radio-group
    v-model="service"
    column
    @update:model-value="
      async () => {
        await setService();
      }
    "
  >
    <v-radio
      v-for="item in [...FETCH.MAP.keys()]"
      :key="item"
      :label="serviceLabels(item)"
      :value="item"
    />
  </v-radio-group>
</template>
