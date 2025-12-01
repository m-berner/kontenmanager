<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IContent} from '@/types'
import type {ComputedRef} from 'vue'
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import {useApp} from '@/composables/useApp'
import ContentCard from '@/components/ContentCard.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const router = useRouter()

const T = Object.freeze({
  GENERAL: {
    TITLE: t('homePage.privacyContent.general.title'),
    PARAGRAPHS: [
      {
        SUBTITLE: t('homePage.privacyContent.general.paragraphs.local.subTitle'),
        CONTENT: t('homePage.privacyContent.general.paragraphs.local.content'),
        ICON: t('homePage.privacyContent.general.paragraphs.local.icon')
      },
      {
        SUBTITLE: t('homePage.privacyContent.general.paragraphs.public.subTitle'),
        CONTENT: t('homePage.privacyContent.general.paragraphs.public.content'),
        ICON: t('homePage.privacyContent.general.paragraphs.public.icon')
      },
      {
        SUBTITLE: t('homePage.privacyContent.general.paragraphs.connection.subTitle'),
        CONTENT: t('homePage.privacyContent.general.paragraphs.connection.content'),
        ICON: t('homePage.privacyContent.general.paragraphs.connection.icon')
      }
    ]
  }
})

let formatData: ComputedRef
if (router.currentRoute.value.path === CONS.ROUTES.PRIVACY) {
  formatData = computed((): IContent[] => {
    const data = []
    for (let i = 0; i < T.GENERAL.PARAGRAPHS.length; i++) {
      data.push({
        subTitle: T.GENERAL.PARAGRAPHS[i].SUBTITLE,
        content: T.GENERAL.PARAGRAPHS[i].CONTENT,
        icon: T.GENERAL.PARAGRAPHS[i].ICON
      })
    }
    return data
  })
}

log('--- SheetContent.vue setup ---')
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
          :data="formatData"
          :title="T.GENERAL.TITLE"/>
    </v-container>
  </v-sheet>
</template>
