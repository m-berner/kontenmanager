<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";

import type {MenuConfigData, MenuItemData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import MenuItem from "@/adapters/primary/components/MenuItem.vue";
import {useMenuAction, useMenuHighlight} from "@/adapters/primary/composables/useMenu";

const props = defineProps<MenuConfigData>();
const {t} = useI18n();
const {alertAdapter} = useAdapters();

const {executeAction} = useMenuAction(t);
const {highlightedItems, highlightTemporary, clearAllHighlights} =
    useMenuHighlight();

const currentColor = computed(
    () => highlightedItems.value.get(props.recordId) || ""
);

onBeforeMount(() => {
  log("COMPONENTS DotMenu: onBeforeMount");
});

const handleMenuOpen = () => {
  log("COMPONENTS DotMenu: handleMenuOpen", props.recordId);
  highlightTemporary(props.recordId);
};

const handleItemClick = async (item: MenuItemData) => {
  log("COMPONENTS DotMenu: handleItemClick", [props.recordId, item.action]);

  try {
    await executeAction(item.action, props.recordId);
    clearAllHighlights();
  } catch (err) {
    log("COMPONENTS DotMenu: action failed", err, "error");
    await alertAdapter.feedbackError("Menu Action Failed", err, {data: item.action});
  }
};

log("COMPONENTS DotMenu: setup");
</script>

<template>
  <v-menu>
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
          :color="currentColor"
          aria-label="Open menu"
          icon="$dots"
          v-bind="menuProps"
          @click="handleMenuOpen"/>
    </template>

    <v-list role="menu">
      <MenuItem
          v-for="item in items"
          :key="item.id"
          :is-highlighted="highlightedItems.has(recordId)"
          :item="item"
          @click="handleItemClick"/>
    </v-list>
  </v-menu>
</template>
