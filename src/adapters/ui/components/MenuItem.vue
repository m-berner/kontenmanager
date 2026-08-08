<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import type {MenuItemData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

defineProps<{
  item: MenuItemData;
  isHighlighted?: boolean;
}>();
const emit = defineEmits<{
  click: [item: MenuItemData];
}>();

log("COMPONENTS MenuItem: setup");
</script>

<!--
  Styling runs through v-list-item's own props instead of scoped CSS on
  `rgb(var(--v-theme-*))`. Vuetify generates those custom properties at runtime
  on the theme root, so nothing in the repo declares them and the IDE cannot
  resolve them.

  Hover is left to v-list-item's own overlay. A v-hover wrapper used to drive an
  orange `base-color` here, but it never fired: VHover only flips `isHovering`
  from the onMouseenter/onMouseleave handlers it hands out in its slot's
  `props`, and those were never bound, so `isHovering` sat at its `null`
  default. Reviving the orange would also have hidden the danger red on hover.

  `active` uses Vuetify's built-in activated overlay for the highlight;
  deliberately no `active-color`, so a highlighted delete item keeps its red
  text rather than having the highlight repaint it.
  -->
<template>
  <v-list-item
      :id="item.id"
      :active="isHighlighted"
      :aria-label="item.title"
      :base-color="item.variant === 'danger' ? 'error' : ''"
      :prepend-icon="item.icon"
      :title="item.title"
      class="menu-item cursor-pointer"
      role="menuitem"
      @click="emit('click', item)"/>
</template>

