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
import type {ContentCardProps} from "@/types";
import {DomainUtils} from "@/domains/utils";

const props = defineProps<ContentCardProps>();

DomainUtils.log("COMPONENTS ContentCard: setup");
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
          {{ item.subTitle }}
        </v-card-title>
        <v-card-text>
          {{ item.content }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
