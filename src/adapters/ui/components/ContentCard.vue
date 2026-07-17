<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Generic content card used to render a list of titled items
 * with optional icons. Primarily used for privacy/help static sections.
 */
import {useI18n} from "vue-i18n";

import type {ContentCardProps} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const props = defineProps<ContentCardProps>();

const {t, tm, rt} = useI18n();
const TRANSLATION_KEY_PATTERN = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/;

const isTranslationKey = (value: string): boolean =>
    TRANSLATION_KEY_PATTERN.test(value);

const getSubTitle = (subTitle: string): string =>
    isTranslationKey(subTitle) ? t(subTitle) : subTitle;

const getRawContent = (item: {
  content: string | string[];
  details?: string | string[];
}): string | string[] =>
    item.content ?? item.details ?? "";

const getListContent = (item: {
  content: string | string[];
  details?: string | string[];
}): string[] => {
  const content = getRawContent(item);
  if (Array.isArray(content)) {
    return content.map((entry) => String(entry));
  }
  if (!isTranslationKey(content)) {
    return [];
  }
  const translated = tm(content);
  if (!Array.isArray(translated)) {
    return [];
  }
  return translated.map((entry) => rt(entry as string));
};

const getTextContent = (item: {
  content: string | string[];
  details?: string | string[];
}): string => {
  const content = getRawContent(item);
  if (Array.isArray(content)) {
    return "";
  }
  return isTranslationKey(content) ? t(content) : content;
};

log("COMPONENTS ContentCard: setup");
</script>

<template>
  <v-row justify="center">
    <v-col cols="12">
      <v-card color="secondary">
        <v-card-title>
          {{ props.title }}
        </v-card-title>
      </v-card>
    </v-col>
    <v-col v-for="item in props.data" :key="item.subTitle" cols="12">
      <v-card>
        <v-card-title class="d-flex">
          <span v-if="item.icon !== ''">
            <v-icon
                v-if="item.icon.substring(0, 1) === '$'"
                :icon="item.icon"/>
            <v-img
                v-else
                :inline="true"
                :src="item.icon"
                height="32"
                width="32"
            /><span>&nbsp;</span>
          </span>
          {{ getSubTitle(item.subTitle) }}
        </v-card-title>
        <v-card-text v-if="getListContent(item).length > 0">
          <ul>
            <li v-for="(step, index) in getListContent(item)" :key="index">
              {{ step }}
            </li>
          </ul>
        </v-card-text>
        <v-card-text v-else>
          {{ getTextContent(item) }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

