<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {useMenuAction, useMenuHighlight} from "@/composables/useMenu";
import MenuItem from "@/components/MenuItem.vue";
import type {MenuConfigData, MenuItemData} from "@/types";
import {DomainUtils} from "@/domains/utils";
import {alertService} from "@/services/alert";

const props = defineProps<MenuConfigData>();
const {t} = useI18n();

const {executeAction} = useMenuAction(t);
const {highlightedItems, highlightTemporary, clearAllHighlights} =
    useMenuHighlight();

const currentColor = computed(
    () => highlightedItems.value.get(props.recordId) || ""
);

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DotMenu: onBeforeMount");
});

const handleMenuOpen = () => {
  DomainUtils.log("COMPONENTS DotMenu: handleMenuOpen", props.recordId);
  highlightTemporary(props.recordId);
};

const handleItemClick = async (item: MenuItemData) => {
  DomainUtils.log("COMPONENTS DotMenu: handleItemClick", [props.recordId, item.action]);

  try {
    await executeAction(item.action, props.recordId);
    clearAllHighlights();
  } catch (err) {
    DomainUtils.log("COMPONENTS DotMenu: action failed", err, "error");
    await alertService.feedbackError("Menu Action Failed", err, {data: item.action});
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
