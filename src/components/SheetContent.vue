<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IContent} from '@/types.d'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import ContentCard from '@/components/childs/ContentCard.vue'
import {useRouter} from 'vue-router'

const {t, tm} = useI18n()
const {CONS, log} = useApp()
const router = useRouter()

const HELP = [
  {title: 'helpContent.successor.title', data: 'helpContent.successor.data'},
  {title: 'helpContent.requirements.title', data: 'helpContent.requirements.data'},
  {title: 'helpContent.browserBar.title', data: 'helpContent.browserBar.data'},
  {title: 'helpContent.toolBar.title', data: 'helpContent.toolBar.data'},
  {title: 'helpContent.dotMenu.title', data: 'helpContent.dotMenu.data'},
  {title: 'helpContent.stocksToolBar.title', data: 'helpContent.stocksToolBar.data'},
  {title: 'helpContent.stocksDotMenu.title', data: 'helpContent.stocksDotMenu.data'}
]
const PRIVACY = [
  {title: 'privacyContent.general.title', data: 'privacyContent.general.data'}
]
const formatData = computed(() => (dataStr: string): IContent[] => {
  const data = []
  for (let i = 0; i < Object.keys(tm(`${dataStr}.subTitle`)).length; i++) {
    data.push({
      subTitle: t(`${dataStr}.subTitle.${i.toString()}`),
      content: t(`${dataStr}.content.${i.toString()}`),
      icon: t(`${dataStr}.icon.${i.toString()}`)
    })
  }
  return data
})
const stringsArray: Ref<{ title: string, data: string }[]> = ref([])

if (router.currentRoute.value.path === CONS.ROUTES.HELP) {
  stringsArray.value = HELP
} else {
  stringsArray.value = PRIVACY
}

router.beforeEach((to) => {
  if (to.path === CONS.ROUTES.HELP) {
    stringsArray.value = HELP
  } else if (to.path === CONS.ROUTES.PRIVACY) {
    stringsArray.value = PRIVACY
  }
})

log('--- SheetContent.vue setup ---')
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <v-row justify="center">
        <v-col cols="8" s="8">
          <ContentCard
              v-for="item in stringsArray"
              :key="item.title"
              :data="formatData(item.data)"
              :title="t(item.title)"/>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>
