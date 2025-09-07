<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IContent} from '@/types.d'
import {defineProps} from 'vue'

interface PropsContentCard {
  title: string
  data: IContent[]
}

const contentCardProps = defineProps<PropsContentCard>()
</script>

<template>
  <v-card color="secondary">
    <v-card-title>
      {{ contentCardProps.title }}
    </v-card-title>
  </v-card>
  <v-card v-for="item in contentCardProps.data" :key="item.title">
    <v-card-title>
      <v-icon v-if="item.icon" :icon="item.icon"/>
      {{ item.title }}
    </v-card-title>
    <v-card-text>
      {{ item.content }}
    </v-card-text>
  </v-card>
</template>
