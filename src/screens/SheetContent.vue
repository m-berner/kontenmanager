<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IContent} from '@/types'
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import ContentCard from '@/components/ContentCard.vue'
import {useRouter} from 'vue-router'

const {t, tm} = useI18n()
const {CONS, log} = useApp()
const router = useRouter()

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
const stringsArray = ref<{ title: string, data: string }[]>([])

if (router.currentRoute.value.path === CONS.ROUTES.PRIVACY) {
  stringsArray.value = PRIVACY
}

router.beforeEach((to) => {
  if (to.path === CONS.ROUTES.PRIVACY) {
    stringsArray.value = PRIVACY
  }
})

log('--- SheetContent.vue setup ---')
</script>

<template>
  <v-sheet class="sheet" color="surface-light">
    <v-container>
      <ContentCard
          v-for="item in stringsArray"
          :key="item.title"
          :data="formatData(item.data)"
          :title="t(item.title)"/>
    </v-container>
  </v-sheet>
</template>
