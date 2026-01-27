<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type { ContentItem } from "@/types";
import type { ComputedRef } from "vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { UtilsService } from "@/domains/utils";
import ContentCard from "@/components/ContentCard.vue";
import { ROUTES } from "@/config/routes";
import { createPrivacyContent } from "@/config/views";

const { t } = useI18n();
const router = useRouter();

const PARAGRAPHS = createPrivacyContent(t);

let formatData: ComputedRef;
if (router.currentRoute.value.path === ROUTES.PRIVACY) {
  formatData = computed((): ContentItem[] => {
    const data = [];
    for (let i = 0; i < PARAGRAPHS.length; i++) {
      data.push({
        subTitle: PARAGRAPHS[i].SUBTITLE,
        content: PARAGRAPHS[i].CONTENT,
        icon: PARAGRAPHS[i].ICON
      });
    }
    return data;
  });
}

UtilsService.log("--- views/SheetContent.vue setup ---");
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
        :data="formatData"
        :title="t('views.sheetContent.privacyContent.general.title')"
      />
    </v-container>
  </v-sheet>
</template>
