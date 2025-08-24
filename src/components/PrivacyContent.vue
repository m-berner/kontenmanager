<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import ContentCard from '@/components/helper/ContentCard.vue'
import {computed, type ComputedRef} from 'vue'

const {t} = useI18n()
const {log} = useApp()

const data: ComputedRef<IContent[]> = computed(() => [
  {
    title: t('privacyContent.data.title.0'),
    content: t('privacyContent.data.content.0'),
    icon: ''
  },
  {
    title: t('privacyContent.data.title.1'),
    content: t('privacyContent.data.content.1'),
    icon: ''
  },
  {
    title: t('privacyContent.data.title.2'),
    content: t('privacyContent.data.content.2'),
    icon: ''
  }
])

log('--- PrivacyContent.vue setup ---')
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="7" sm="7">
        <ContentCard
            :title="t('privacyContent.title')"
            :data="data"></ContentCard>
      </v-col>
    </v-row>
  </v-container>
</template>
