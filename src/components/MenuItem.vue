<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { computed } from "vue";
import type { MenuItemData } from "@/types";

const props = defineProps<{
  item: MenuItemData;
  isHighlighted?: boolean;
}>();
const emit = defineEmits<{
  click: [item: MenuItemData];
}>();

const itemClass = computed(() => ({
  "menu-item": true,
  "menu-item--danger": props.item.variant === "danger",
  "menu-item--highlighted": props.isHighlighted
}));
</script>

<template>
  <v-hover v-slot="{ isHovering }">
    <v-list-item
      :id="item.id"
      :aria-label="item.title"
      :base-color="isHovering ? 'orange' : ''"
      :class="itemClass"
      :prepend-icon="item.icon"
      :title="item.title"
      class="pointer"
      role="menuitem"
      @click="emit('click', item)"
    />
  </v-hover>
</template>
