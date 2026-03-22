2<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview PrivacyContent renders static, localized privacy sections
 * using the generic `ContentCard` component.
 */
import {useI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import ContentCard from "@/adapters/primary/components/ContentCard.vue";

const {t, tm} = useI18n();

log("VIEWS PrivacyContent: setup");
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
          :data="tm('views.privacyContent.general.paragraphs')"
          :title="t('views.privacyContent.general.title')"/>
    </v-container>
  </v-sheet>
</template>

