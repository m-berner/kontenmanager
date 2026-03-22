<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview HelpContent is a static, localized help page describing the
 * app’s main areas (Home, Company), basic workflows, and keyboard/menu hints.
 * Content is intentionally simple HTML rendered via Vuetify components.
 */
import {useI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import ContentCard from "@/adapters/primary/components/ContentCard.vue";

const {t, tm} = useI18n();

log("VIEWS HelpContent: setup");
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
          :data="tm('views.helpContent.paragraphs')"
          :title="t('views.helpContent.title')"/>
    </v-container>
  </v-sheet>
</template>

