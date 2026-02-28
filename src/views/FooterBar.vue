<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {DomainUtils} from "@/domains/utils";
import type {ViewTypePathType} from "@/types";

const MAILTO = "mailto:kontenmanager@gmx.de";
const HELP: ViewTypePathType = "/help";
const PRIVACY: ViewTypePathType = "/privacy";

const {t} = useI18n();

onBeforeMount(() => {
  DomainUtils.log("VIEWS FooterBar: onBeforeMount");
});

DomainUtils.log("VIEWS FooterBar: setup");
</script>

<template>
  <v-bottom-navigation color="primary">
    <v-btn color="white" :to="HELP">
      <v-icon icon="$help"/>
      <div>{{ t("views.footerBar.help") }}</div>
    </v-btn>
    <v-btn color="white" :to="PRIVACY">
      <v-icon icon="$privacy"/>
      <div>{{ t("views.footerBar.privacy") }}</div>
    </v-btn>
    <v-btn :href="MAILTO" color="white">
      <v-icon icon="$mail"/>
      <div>{{ t("views.footerBar.mail") }}</div>
    </v-btn>
  </v-bottom-navigation>
</template>
