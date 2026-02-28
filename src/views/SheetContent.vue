<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview SheetContent renders privacy (and similar) static content
 * sections using a generic `ContentCard` component. It maps configured
 * paragraphs into a displayable list when the current route matches privacy.
 */
import type {ContentItem, ViewTypePathType} from "@/types";
import {computed, onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {DomainUtils} from "@/domains/utils";
import ContentCard from "@/components/ContentCard.vue";
import {createPrivacyContent} from "@/configs/views";

const {t} = useI18n();
const router = useRouter();

const PATH: ViewTypePathType = "/privacy";
const PARAGRAPHS = computed(() => createPrivacyContent(t));

const formatData = computed<ContentItem[] | undefined>(() => {
  if (router.currentRoute.value.path !== PATH) return undefined;
  return PARAGRAPHS.value.map((p) => ({
    subTitle: p.SUBTITLE,
    content: p.CONTENT,
    icon: p.ICON
  }));
});

onBeforeMount(() => {
  DomainUtils.log("VIEWS SheetContent: onBeforeMount");
});

DomainUtils.log("VIEWS SheetContent: setup");
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
          v-if="formatData"
          :data="formatData"
          :title="t('views.sheetContent.privacyContent.general.title')"/>
    </v-container>
  </v-sheet>
</template>
