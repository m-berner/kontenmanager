<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Renders one Vuetify field validation message with the app's
 * `$error` icon alias (vuetify.ts) alongside the text, meant to be dropped
 * into a `v-text-field`/`v-select`'s `#message="{ message }"` slot:
 *
 *   <template #message="{ message }">
 *     <ValidationMessage :message="message"/>
 *   </template>
 *
 * A field only shows a message here when it actually has failing `:rules`
 * (no hint/persistent-hint is used anywhere this is applied), so the icon is
 * always paired with a genuine validation failure, never a neutral hint.
 */
defineProps<{ message: string }>();
</script>

<template>
  <span class="validation-message">
    <v-icon icon="$error" size="14"/>
    {{ message }}
  </span>
</template>

<style scoped>
.validation-message {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
