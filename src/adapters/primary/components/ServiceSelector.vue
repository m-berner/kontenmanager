<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed} from "vue";

import {FETCH} from "@/domain/constants";
import type {ServiceName} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/primary/stores/settings";

const settings = useSettingsStore();

const service = computed({
  get: () => settings.service,
  set: (next: string) => {
    log("COMPONENTS ServiceSelector: setService");
    void settings.setService(next);
  }
});

const serviceLabels = (item: ServiceName): string => {
  const service = FETCH.PROVIDERS[item];
  if (service !== undefined && service?.NAME !== undefined) {
    return service.NAME;
  } else {
    return "Label not found";
  }
};

log("COMPONENTS ServiceSelector: setup");
</script>

<template>
  <v-radio-group
      v-model="service"
      column>
    <v-radio
        v-for="item in [...Object.keys(FETCH.PROVIDERS)]"
        :key="item"
        :label="serviceLabels(item as ServiceName)"
        :value="item"/>
  </v-radio-group>
</template>
