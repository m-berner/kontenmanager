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
/**
 * The per-booking-type rows — and *only* those. This is what the table
 * paginates.
 *
 * The Sum row (plus, for a depot account, Taxes and Fees) used to be appended to
 * this same array, so they were paginated with the data. With more booking types
 * than fit on a page at `settings.sumsPerPage` (default 11), the total moved to
 * the last page: the first page of an accounting summary showed figures with no
 * total, and the last showed a total with no context. The two depot rows made it
 * worse by consuming 2 of the 11 slots on page 1 while the total they contribute
 * to sat elsewhere. They now live in {@link summaryEntries}, rendered in the
 * table's `body.append` slot so they are visible on every page.
 */
const accountEntries = computed(() => {
  const {sums} = getAccountData(selected.value);

  return sums.map((entry, i): AccountEntry => ({
    id: i,
    name: entry.value,
    sum: entry.key,
    nameClass: "",
    sumClass: entry.key < 0 ? "color-red" : ""
  }));
});

/**
 * The Taxes/Fees/Sum rows, pinned below the paginated body on every page.
 *
 * Ids continue past `accountEntries`' range so the two sets never collide — they
 * are rendered separately now, but the hidden id cell still shows them and a
 * duplicate would be confusing.
 */
const summaryEntries = computed(() => {
  const {sums, taxes, fees} = getAccountData(selected.value);
  const result: AccountEntry[] = [];
  const finalSum = sums.reduce((acc, entry) => acc + entry.key, 0);

  if (records.isDepot) {
    result.push({
      id: sums.length + 1,
      name: t("components.dialogs.showAccounting.taxes"),
      sum: taxes,
      nameClass: "",
      sumClass: "color-red"
    });
    result.push({
      id: sums.length + 2,
      name: t("components.dialogs.showAccounting.fees"),
      sum: fees,
      nameClass: "",
      sumClass: "color-red"
    });
  }

  // Taxes and fees are only *shown* for a depot account (the branch above), so
  // they must only be *counted* for one too. Otherwise the total silently
  // disagrees with the sum of the visible rows, with nothing on screen to
  // explain the gap. Today a non-depot account always has zero taxes/fees (it
  // has no Buy/Sell/Dividend booking types, so every booking resolves to the
  // "other" role, and both write paths — mapBookingFormToDb and
  // applyBookingRoleInvariants — zero those fields for it). So an unconditional
  // addition would happen to be correct. It would be correct only by that
  // invariant, not by construction; gate it explicitly instead.
  const total = records.isDepot ? finalSum + taxes + fees : finalSum;
  result.push({
    id: sums.length,
    name: t("components.dialogs.showAccounting.sum"),
    sum: total,
    nameClass: "font-weight-bold",
    // Bold always; red too when negative — the same rule accountEntries
    // applies per row (entry.key < 0 above), just missing here before.
    sumClass: total < 0 ? "font-weight-bold color-red" : "font-weight-bold"
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
          <!--
            Pinned below the body rather than included in `:items`, so the total
            (and, for a depot account, Taxes and Fees) is on screen whichever
            page the user is on. `body.append` renders after the current page's
            rows on every page, which is exactly the wanted behaviour and is why
            these are not table `items`.
          -->
          <template v-slot:[`body.append`]>
            <tr
                v-for="entry in summaryEntries"
                :key="entry.id"
                class="table-row">
              <td class="d-none">{{ entry.id }}</td>
              <td :class="entry.nameClass">{{ entry.name }}</td>
              <td :class="entry.sumClass">{{ n(entry.sum, "currency") }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
