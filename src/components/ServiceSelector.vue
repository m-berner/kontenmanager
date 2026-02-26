<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {DomainUtils} from "@/domains/utils";
import {useStorage} from "@/composables/useStorage";
import {useAlert} from "@/composables/useAlert";
import {BROWSER_STORAGE} from "@/domains/configs/storage";
import {FETCH} from "@/configs/fetch";

const {getStorage, setStorage} = useStorage();
const {handleUserError} = useAlert();

const service = ref<string>(BROWSER_STORAGE.SERVICE.value);

const setService = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS ServiceSelector: setService");
  try {
    await setStorage(BROWSER_STORAGE.SERVICE.key, service.value);
  } catch (err) {
    await handleUserError("Components ServiceSelector", err, {});
  }
};

const serviceLabels = (item: string): string => {
  const service = FETCH.PROVIDERS[item];
  if (service !== undefined && service?.NAME !== undefined) {
    return service.NAME;
  } else {
    return "Label not found";
  }
};

onBeforeMount(async () => {
  DomainUtils.log("COMPONENTS ServiceSelector: onBeforeMount");
  try {
    const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
    service.value = storageService[BROWSER_STORAGE.SERVICE.key] as string;
  } catch (err) {
    await handleUserError("Components ServiceSelector", err, {});
  }
});

DomainUtils.log("COMPONENTS ServiceSelector: setup");
</script>

<template>
  <v-radio-group
      v-model="service"
      column
      @update:model-value="async () => { await setService(); }">
    <v-radio
        v-for="item in [...Object.keys(FETCH.PROVIDERS)]"
        :key="item"
        :label="serviceLabels(item)"
        :value="item"/>
  </v-radio-group>
</template>
