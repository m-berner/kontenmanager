<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview HelpContent is a static, localized help page describing the
 * app’s main areas (Home, Company), basic workflows, and keyboard/menu hints.
 * Content is intentionally simple HTML rendered via Vuetify components.
 */
import {onBeforeMount} from "vue";
import {DomainUtils} from "@/domains/utils";

onBeforeMount(() => {
  DomainUtils.log("VIEWS HelpContent: onBeforeMount");
});

DomainUtils.log("VIEWS HelpContent: setup");
</script>

<template>
  <v-container class="pa-4" fluid>
    <v-row>
      <v-col class="mx-auto" cols="12" lg="8" md="10">
        <v-card variant="flat">
          <v-card-title class="text-h5 mb-2">
            {{ $t("views.helpContent.title") }}
          </v-card-title>

          <v-card-text class="text-body-1">
            <v-divider class="mb-4"/>

            <!-- Overview -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.overview.title") }}
              </h3>
              <p>
                {{ $t("views.helpContent.overview.description") }}
              </p>
            </section>

            <!-- Getting Started -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.gettingStarted.title") }}
              </h3>
              <ul>
                <li v-for="(step, index) in $tm('views.helpContent.gettingStarted.steps')" :key="index">
                  {{ $rt(step) }}
                </li>
              </ul>
            </section>

            <!-- Bookings -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.bookings.title") }}
              </h3>
              <ul>
                <li v-for="(detail, index) in $tm('views.helpContent.bookings.details')" :key="index">
                  {{ $rt(detail) }}
                </li>
              </ul>
            </section>

            <!-- Stocks / Depot -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.stocks.title") }}
              </h3>
              <ul>
                <li v-for="(detail, index) in $tm('views.helpContent.stocks.details')" :key="index">
                  {{ $rt(detail) }}
                </li>
              </ul>
            </section>

            <!-- Settings / Options -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.settings.title") }}
              </h3>
              <ul>
                <li v-for="(detail, index) in $tm('views.helpContent.settings.details')" :key="index">
                  {{ $rt(detail) }}
                </li>
              </ul>
            </section>

            <!-- Keyboard Shortcuts -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.shortcuts.title") }}
              </h3>
              <p>
                {{ $t("views.helpContent.shortcuts.description") }}
              </p>
            </section>

            <!-- Privacy -->
            <section class="mb-2">
              <h3 class="text-h6 mb-2">
                {{ $t("views.helpContent.privacy.title") }}
              </h3>
              <p>
                {{ $t("views.helpContent.privacy.description") }}
              </p>
            </section>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
