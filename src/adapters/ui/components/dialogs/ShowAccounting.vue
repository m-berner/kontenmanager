<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS, createAccountingHeaders, DATE, DIALOG_ITEMS_PER_PAGE_OPTIONS} from "@/domain/constants";
import type {AccountEntry} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const setSumsPerPage = (value: number) => settings.setSumsPerPage(value);

const HEADERS = computed(() => createAccountingHeaders(t));

const selected = ref<number | null>(COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID);

const yearEntries = computed(() => {
  const years = [
    COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID,
    ...Array.from(records.bookings.bookedYears)
  ];

  // Only offered when such bookings exist, so the selector gains an entry that
  // is always non-empty rather than a permanent row reading 0.00. Without it,
  // bookings with no usable cBookDate are counted by "All Years" but by no
  // calendar year, and `bookedYears` cannot list them — their year is NaN,
  // which its own Number.isFinite filter drops. The dialog then shows a total
  // that no selection reproduces.
  if (records.bookings.hasUndatedBookings) {
    years.push(DATE.UNDATED_YEAR);
  }

  return years.map((entry) => {
    return {
      id: entry,
      title: getYearTitle(entry)
    };
  });
});

const getYearTitle = (entry: number): string => {
  if (entry === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID) {
    return t("components.dialogs.showAccounting.allYears");
  }
  if (entry === DATE.UNDATED_YEAR) {
    return t("components.dialogs.showAccounting.undated");
  }
  return entry.toString();
};
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

  // Add the total sum.
  //
  // Taxes and fees are only *shown* for a depot account (the two unshift calls
  // above), so they must only be *counted* for one too. Otherwise, the total
  // silently disagrees with the sum of the visible rows, with nothing on screen
  // to explain the gap. Today a non-depot account always has zero taxes/fees
  // (it has no Buy/Sell/Dividend booking types, so every booking resolves to
  // the "other" role, and both write paths — mapBookingFormToDb and
  // applyBookingRoleInvariants — zero those fields for it). So the old
  // unconditional addition happened to be correct. It was correct only by that
  // invariant, not by construction; gate it explicitly instead.
  result.push({
    id: sums.length,
    name: t("components.dialogs.showAccounting.sum"),
    sum: records.isDepot ? finalSum + taxes + fees : finalSum,
    nameClass: "font-weight-bold",
    sumClass: "font-weight-bold"
  });

  return result;
});

const getAccountData = (year: number | null) => {
  // The year select is `clearable`, which emits `null` (not `undefined`) when
  // cleared — treat that the same as "All Years" instead of falling through
  // to the per-year branch, where aggregateBookingsPerType's truthy year
  // check would silently return all-time sums. While sumTaxes/sumFees's
  // strict `=== year` equality would silently return 0, producing a
  // mismatched, wrong total.
  if (year === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID || year === null) {
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
            :items-per-page-options="DIALOG_ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('components.dialogs.showAccounting.itemsPerPageText')"
            :no-data-text="t('components.dialogs.showAccounting.noDataText')"
            density="compact"
            item-value="id"
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
