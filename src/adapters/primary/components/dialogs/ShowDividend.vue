<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {createDividendHeaders} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {d, n, t} = useI18n();
const settings = useSettingsStore();
const setDividendsPerPage = (value: number) =>
    settings.setDividendsPerPage(value);
const {activeId} = useRuntimeStore();
const records = useRecordsStore();

const ITEMS_PER_PAGE_OPTIONS = [
  {
    value: 5,
    title: "5"
  },
  {
    value: 6,
    title: "6"
  },
  {
    value: 7,
    title: "7"
  },
  {
    value: 8,
    title: "8"
  },
  {
    value: 9,
    title: "9"
  },
  {
    value: 10,
    title: "10"
  },
  {
    value: 11,
    title: "11"
  }
];

const HEADERS = computed(() => createDividendHeaders(t));

defineExpose({title: t("components.dialogs.showDividend.title")});

log("COMPONENTS DIALOGS ShowDividend: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-data-table
            :headers="HEADERS"
            :hide-no-data="false"
            :hover="false"
            :items="records.bookings.dividendsByStockId(activeId)"
            :items-per-page="settings.dividendsPerPage"
            :items-per-page-options="ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('components.dialogs.showDividend.itemsPerPageText')"
            :no-data-text="t('components.dialogs.showDividend.noDataText')"
            density="compact"
            item-key="id"
            @update:items-per-page="setDividendsPerPage">
          <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
              <td class="d-none">{{ item.id }}</td>
              <td>{{ d(item.year, "short") }}</td>
              <td>{{ n(item.sum, "currency") }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
