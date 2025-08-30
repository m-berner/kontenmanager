<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useRuntimeStore} from '@/stores/runtime'
import {ref} from 'vue'

const {t} = useI18n()
const dialogRef = ref<{ onClickOk: () => Promise<void>, title: string }>()
const runtime = useRuntimeStore()
</script>

<template>
  <Teleport to="body">
    <v-dialog :modelValue="runtime.teleport.visibility" :persistent="true" width="500">
      <v-card>
        <v-card-title class="text-center">
          {{ dialogRef?.title }}
        </v-card-title>
        <v-card-text class="pa-5">
          <component :is="runtime.teleport.dialogName" ref="dialogRef"/>
        </v-card-text>
        <v-card-actions class="pa-5">
          <v-tooltip :text="t('dialogs.ok')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                  v-if="runtime.teleport.okButton"
                  class="ml-auto"
                  icon="$check"
                  type="submit"
                  v-bind="props"
                  variant="outlined"
                  @click="dialogRef?.onClickOk"
              />
            </template>
          </v-tooltip>
          <v-spacer/>
          <v-tooltip :text="t('dialogs.cancel')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                  class="ml-auto"
                  icon="$close"
                  v-bind="props"
                  variant="outlined"
                  @click="runtime.resetTeleport"
              />
            </template>
          </v-tooltip>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </Teleport>
</template>
