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
import {computed} from "vue";
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

/**
 * Each section resolved once, instead of the template calling
 * `getListContent(item)` twice per item — once to decide which branch to render
 * (`v-if="…length > 0"`) and again to iterate it. Every call re-ran `tm()` and
 * mapped `rt()` over the whole array, and the duplication was invisible at the
 * call site because the two uses sit in different elements.
 */
const sections = computed(() =>
    props.data.map((item) => ({
      icon: item.icon,
      subTitle: getSubTitle(item.subTitle),
      list: getListContent(item),
      text: getTextContent(item)
    }))
);

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
    <!--
      Keyed on the array index, not on `item.subTitle`. `subTitle` is free-form
      content from the locale files (`tm('views.helpContent.paragraphs')`,
      `tm('views.privacyContent.general.paragraphs')`) with nothing constraining
      it to be unique and nothing that would flag a duplicate — two help sections
      sharing a heading, or two items with an empty `subTitle`, silently gave Vue
      two identical keys. Duplicate keys are not an error in Vue; they make it
      reuse or misplace DOM nodes during patching, so it would have surfaced as
      sections rendering the wrong body rather than as a crash.

      The index is the honest key here: this is static, ordered content with no
      identity of its own, never reordered or filtered.
    -->
    <v-col v-for="(section, index) in sections" :key="index" cols="12">
      <v-card>
        <v-card-title class="d-flex">
          <span v-if="section.icon !== ''">
            <v-icon
                v-if="section.icon.substring(0, 1) === '$'"
                :icon="section.icon"/>
            <v-img
                v-else
                :inline="true"
                :src="section.icon"
                height="32"
                width="32"
            /><span>&nbsp;</span>
          </span>
          {{ section.subTitle }}
        </v-card-title>
        <v-card-text v-if="section.list.length > 0">
          <ul>
            <li v-for="(step, stepIndex) in section.list" :key="stepIndex">
              {{ step }}
            </li>
          </ul>
        </v-card-text>
        <v-card-text v-else>
          {{ section.text }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

