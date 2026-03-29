<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS, createAccountingHeaders} from "@/domain/constants";
import type {AccountEntry} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const setSumsPerPage = (value: number) => settings.setSumsPerPage(value);

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

const HEADERS = computed(() => createAccountingHeaders(t));

const selected = ref<number>(COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID);

const yearEntries = computed(() => {
  const years = [
    COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID,
    ...Array.from(records.bookings.bookedYears)
  ];
  return years.map((entry) => {
    return {
      id: entry,
      title:
          entry === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID
              ? t("components.dialogs.showAccounting.allYears")
              : entry.toString()
    };
  });
});
const accountEntries = computed(() => {
  const result: AccountEntry[] = [];
  const {sums, taxes, fees} = getAccountData(selected.value);

  let finalSum = 0;

  // Add individual booking type sums
  for (let i = 0; i < sums.length; i++) {
    const sumValue = sums[i].key;
    const sumClass = sumValue < 0 ? "color-red" : "";

    result.push({
      id: i,
      name: sums[i].value,
      sum: sumValue,
      nameClass: "",
      sumClass
    });
    finalSum += sumValue;
  }

  // Add fees and taxes for depot accounts
  if (records.isDepot) {
    result.unshift({
      id: sums.length + 2,
      name: t("components.dialogs.showAccounting.fees"),
      sum: fees,
      nameClass: "",
      sumClass: "color-red"
    });
    result.unshift({
      id: sums.length + 1,
      name: t("components.dialogs.showAccounting.taxes"),
      sum: taxes,
      nameClass: "",
      sumClass: "color-red"
    });
  }

  // Add the total sum
  result.push({
    id: sums.length,
    name: t("components.dialogs.showAccounting.sum"),
    sum: finalSum + taxes + fees,
    nameClass: "font-weight-bold",
    sumClass: "font-weight-bold"
  });

  return result;
});

const getAccountData = (year: number) => {
  if (year === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID) {
    return {
      sums: records.accounting.sumBookingsPerType,
      taxes: records.bookings.sumAllTaxes,
      fees: records.bookings.sumAllFees
    };
  }

  return {
    sums: records.accounting.sumBookingsPerTypeAndYear(year),
    taxes: records.bookings.sumTaxes(year),
    fees: records.bookings.sumFees(year)
  };
};

defineExpose({title: t("components.dialogs.showAccounting.title")});

log("COMPONENTS DIALOGS ShowAccounting: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-select
        v-model="selected"
        :items="yearEntries"
        :label="t('components.dialogs.showAccounting.year')"
        clearable
        density="compact"
        item-title="title"
        item-value="id"
        max-width="300"
        variant="outlined"/>
    <v-card>
      <v-card-text class="pa-5">
        <v-data-table
            :headers="HEADERS"
            :hide-no-data="false"
            :hover="false"
            :items="accountEntries"
            :items-per-page="settings.sumsPerPage"
            :items-per-page-options="ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('components.dialogs.showAccounting.itemsPerPageText')"
            :no-data-text="t('components.dialogs.showAccounting.noDataText')"
            density="compact"
            item-key="id"
            @update:items-per-page="setSumsPerPage">
          <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
              <td class="d-none">{{ item.id }}</td>
              <td :class="item.nameClass">{{ item.name }}</td>
              <td :class="item.sumClass">{{ n(item.sum, "currency") }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
