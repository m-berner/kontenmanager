<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import { ROUTES } from "@/configs/routes";
import { DEFAULTS } from "@/configs/defaults";

const { t } = useI18n();

DomainUtils.log("VIEWS FooterBar: setup");
</script>

<template>
  <v-bottom-navigation color="primary">
    <v-btn color="white" :to="ROUTES.HELP">
      <v-icon icon="$help" />
      <div>{{ t("views.footerBar.help") }}</div>
    </v-btn>
    <v-btn color="white" :to="ROUTES.PRIVACY">
      <v-icon icon="$privacy" />
      <div>{{ t("views.footerBar.privacy") }}</div>
    </v-btn>
    <v-btn :href="DEFAULTS.MAILTO" color="white">
      <v-icon icon="$mail" />
      <div>{{ t("views.footerBar.mail") }}</div>
    </v-btn>
    <v-btn :disabled="true" color="white">
      <v-icon icon="$mdiCopyright" />
      <div class="nowrap">{{ DEFAULTS.COPYRIGHT }}</div>
    </v-btn>
  </v-bottom-navigation>
</template>
