<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Toggles `log()`'s runtime debug override. Modeled on
 * `ThemeSelector`/`CurrencySelector`, which write into the settings store
 * the same way.
 *
 * Off by default (see `BROWSER_STORAGE.DEBUG_LOGS`): the point is a
 * temporary, no-rebuild way to get structured console logs out of an
 * already-installed extension while diagnosing an issue, not a permanently
 * enabled verbose mode.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const settings = useSettingsStore();

const debugLogs = computed({
  get: () => settings.debugLogs,
  set: (next: boolean) => {
    log("COMPONENTS DebugLogsToggle: setDebugLogs");
    void settings.setDebugLogs(next);
  }
});

log("COMPONENTS DebugLogsToggle: setup");
</script>

<template>
  <v-switch
      v-model="debugLogs"
      :label="t('views.optionsIndex.debugLogs.label')"
      color="red"
      variant="outlined">
    <template #details>
      <div class="text-caption">{{ t("views.optionsIndex.debugLogs.hint") }}</div>
    </template>
  </v-switch>
</template>
