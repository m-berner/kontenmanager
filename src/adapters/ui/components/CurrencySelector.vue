<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Selects the app-level default currency. Modelled on
 * `ThemeSelector`, which writes its value into the settings store the same way.
 *
 * This is the *default*, not the display currency: it seeds `cCurrency` for
 * newly created accounts and is the fallback while no account is active. What
 * an account's figures are actually denominated in lives on the account itself
 * (`AccountDb.cCurrency`, edited in `AccountForm`), because that is a property
 * of the money rather than a preference — which is also why changing this does
 * not touch existing accounts.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {CURRENCIES} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const settings = useSettingsStore();

const currency = computed({
  get: () => settings.currency,
  set: (next: string) => {
    log("COMPONENTS CurrencySelector: setCurrency");
    void settings.setCurrency(next);
  }
});

log("COMPONENTS CurrencySelector: setup");
</script>

<template>
  <v-radio-group v-model="currency" column>
    <!--
      ISO codes as their own labels, untranslated — see the matching note in
      `AccountForm`. `persistent-hint` on the group carries the one thing that
      does need words: that this is only the default for new accounts.
    -->
    <v-radio
        v-for="item in CURRENCIES.SUPPORTED"
        :key="item"
        :label="item"
        :value="item"/>
    <template #details>
      <div class="text-caption">{{ t("views.optionsIndex.currency.hint") }}</div>
    </template>
  </v-radio-group>
</template>
