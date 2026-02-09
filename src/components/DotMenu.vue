<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { computed } from "vue";
import { useMenuAction, useMenuHighlight } from "@/composables/useMenu";
import MenuItem from "@/components/MenuItem.vue";
import type { MenuConfigData, MenuItemData } from "@/types";
import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";

const props = defineProps<MenuConfigData>();

const alertStore = useAlertStore();
const { executeAction } = useMenuAction();
const { highlightedItems, highlightTemporary, clearAllHighlights } =
  useMenuHighlight();

const currentColor = computed(
  () => highlightedItems.value.get(props.recordId) || ""
);

const handleMenuOpen = () => {
  DomainUtils.log("DOT_MENU: handleMenuOpen", props.recordId);
  highlightTemporary(props.recordId);
};

const handleItemClick = async (item: MenuItemData) => {
  DomainUtils.log("DOT_MENU: handleItemClick", [props.recordId, item.action]);

  try {
    await executeAction(item.action, props.recordId);
    clearAllHighlights();
  } catch (err) {
    DomainUtils.log("DOT_MENU: action failed", err, "error");
    alertStore.error(
      "Menu Action Failed",
      err instanceof Error ? err.message : "An unknown error occurred"
    );
  }
};

DomainUtils.log("COMPONENTS DotMenu: setup");
</script>

<template>
  <v-menu>
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        :color="currentColor"
        aria-label="Open menu"
        icon="$dots"
        v-bind="menuProps"
        @click="handleMenuOpen"
      />
    </template>

    <v-list role="menu">
      <MenuItem
        v-for="item in items"
        :key="item.id"
        :is-highlighted="highlightedItems.has(recordId)"
        :item="item"
        @click="handleItemClick"
      />
    </v-list>
  </v-menu>
</template>
