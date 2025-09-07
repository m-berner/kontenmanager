<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IContent} from '@/types.d'
import type {ComputedRef} from 'vue'
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useNotification} from '@/composables/useNotification'
import ContentCard from '@/components/childs/ContentCard.vue'

const {t} = useI18n()
const {log} = useNotification()

const requests: ComputedRef<IContent[]> = computed(() => [
  {
    title: t('helpContent.requests.title.0'),
    content: t('helpContent.requests.content.0'),
    icon: t('helpContent.requests.icon.0')
  },
  {
    title: t('helpContent.requests.title.1'),
    content: t('helpContent.requests.content.1'),
    icon: t('helpContent.requests.icon.1')
  }
])
const toolBar: ComputedRef<IContent[]> = computed(() => [
  {
    title: t('helpContent.toolBar.title.0'),
    content: t('helpContent.toolBar.content.0'),
    icon: t('helpContent.toolBar.icon.0')
  },
  {
    title: t('helpContent.toolBar.title.1'),
    content: t('helpContent.toolBar.content.1'),
    icon: t('helpContent.toolBar.icon.1')
  },
  {
    title: t('helpContent.toolBar.title.2'),
    content: t('helpContent.toolBar.content.2'),
    icon: t('helpContent.toolBar.icon.2')
  },
  {
    title: t('helpContent.toolBar.title.3'),
    content: t('helpContent.toolBar.content.3'),
    icon: t('helpContent.toolBar.icon.3')
  },
  {
    title: t('helpContent.toolBar.title.4'),
    content: t('helpContent.toolBar.content.4'),
    icon: t('helpContent.toolBar.icon.4')
  },
  {
    title: t('helpContent.toolBar.title.5'),
    content: t('helpContent.toolBar.content.5'),
    icon: t('helpContent.toolBar.icon.5')
  },
  {
    title: t('helpContent.toolBar.title.6'),
    content: t('helpContent.toolBar.content.6'),
    icon: t('helpContent.toolBar.icon.6')
  },
  {
    title: t('helpContent.toolBar.title.7'),
    content: t('helpContent.toolBar.content.7'),
    icon: t('helpContent.toolBar.icon.7')
  },
  {
    title: t('helpContent.toolBar.title.8'),
    content: t('helpContent.toolBar.content.8'),
    icon: t('helpContent.toolBar.icon.8')
  },
  {
    title: t('helpContent.toolBar.title.9'),
    content: t('helpContent.toolBar.content.9'),
    icon: t('helpContent.toolBar.icon.9')
  },
  {
    title: t('helpContent.toolBar.title.10'),
    content: t('helpContent.toolBar.content.10'),
    icon: t('helpContent.toolBar.icon.10')
  },
  {
    title: t('helpContent.toolBar.title.11'),
    content: t('helpContent.toolBar.content.11'),
    icon: t('helpContent.toolBar.icon.11')
  },
  {
    title: t('helpContent.toolBar.title.12'),
    content: t('helpContent.toolBar.content.12'),
    icon: t('helpContent.toolBar.icon.12')
  },
  {
    title: t('helpContent.toolBar.title.13'),
    content: t('helpContent.toolBar.content.13'),
    icon: t('helpContent.toolBar.icon.13')
  },
  {
    title: t('helpContent.toolBar.title.14'),
    content: t('helpContent.toolBar.content.14'),
    icon: t('helpContent.toolBar.icon.14')
  }
])
const companyBar: ComputedRef<IContent[]> = computed(() => [
  {
    title: t('helpContent.companyBar.title.0'),
    content: '',
    icon: t('helpContent.companyBar.icon.0')
  },
  {
    title: t('helpContent.companyBar.title.1'),
    content: '',
    icon: t('helpContent.companyBar.icon.1')
  },
  {
    title: t('helpContent.companyBar.title.2'),
    content: '',
    icon: t('helpContent.companyBar.icon.2')
  },
  {
    title: t('helpContent.companyBar.title.3'),
    content: '',
    icon: t('helpContent.companyBar.icon.3')
  },
  {
    title: t('helpContent.companyBar.title.4'),
    content: '',
    icon: t('helpContent.companyBar.icon.4')
  },
  {
    title: t('helpContent.companyBar.title.5'),
    content: '',
    icon: t('helpContent.companyBar.icon.5')
  }
])
const transferBar: ComputedRef<IContent[]> = computed(() => [
  {
    title: t('helpContent.transferBar.title.0'),
    content: t('helpContent.transferBar.content.0'),
    icon: t('helpContent.transferBar.icon.0')
  },
  {
    title: t('helpContent.transferBar.title.1'),
    content: t('helpContent.transferBar.content.1'),
    icon: t('helpContent.transferBar.icon.1')
  }
])

log('--- HelpContent.vue setup ---')
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <v-row justify="center">
        <v-col cols="8" s="8">
          <ContentCard
              :data="requests"
              :title="t('helpContent.requestsTitle')"/>
          <ContentCard
              :data="toolBar"
              :title="t('helpContent.toolBarTitle')"/>
          <ContentCard
              :data="companyBar"
              :title="t('helpContent.companyBarTitle')"/>
          <ContentCard
              :data="transferBar"
              :title="t('helpContent.transferBarTitle')"/>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>
