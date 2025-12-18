<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { computed } from 'vue'
import type { I_Menu_Item } from '@/types'

const props = defineProps<{
    item: I_Menu_Item
    isHighlighted?: boolean
}>()

const emit = defineEmits<{
    click: [item: I_Menu_Item]
}>()

const itemClass = computed(() => ({
    'menu-item': true,
    'menu-item--danger': props.item.variant === 'danger',
    'menu-item--highlighted': props.isHighlighted
}))
</script>

<template>
    <v-hover v-slot="{ isHovering }">
        <v-list-item
            :id="item.id"
            :class="itemClass"
            :prepend-icon="item.icon"
            :title="item.title"
            :base-color="isHovering ? 'orange' : ''"
            class="pointer"
            role="menuitem"
            :aria-label="item.title"
            @click="emit('click', item)"
        />
    </v-hover>
</template>

<style scoped>
.menu-item--danger:hover {
    background-color: rgba(255, 0, 0, 0.1);
}
</style>
