<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";

import type {ViewPathType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const MAILTO = "mailto:kontenmanager@gmx.de";
const HELP: ViewPathType = "/help";
const PRIVACY: ViewPathType = "/privacy";

const {t} = useI18n();

log("VIEWS FooterBar: setup");
</script>

<template>
  <v-bottom-navigation color="primary">
    <v-btn :to="HELP" color="white">
      <v-icon icon="$help"/>
      <div>{{ t("views.footerBar.help") }}</div>
    </v-btn>
    <v-btn :to="PRIVACY" color="white">
      <v-icon icon="$privacy"/>
      <div>{{ t("views.footerBar.privacy") }}</div>
    </v-btn>
    <v-btn :href="MAILTO" color="white">
      <v-icon icon="$mail"/>
      <div>{{ t("views.footerBar.mail") }}</div>
    </v-btn>
  </v-bottom-navigation>
</template>

