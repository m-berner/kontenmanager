<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import {
  BOOKING_TYPE_ROLE,
  COMPONENTS,
  createAccountingHeaders,
  DATE,
  DIALOG_ITEMS_PER_PAGE_OPTIONS
} from "@/domain/constants";
import {resolveAccountingTotal} from "@/domain/logic";
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
 * `category-highlight` (style.css) — a translucent background wash on the
 * category cell, not a text color. An earlier `text-info` attempt (Vuetify's
 * per-theme `info` semantic color as text) read fine on paper but not on
 * screen: `info` was only ever measured against each theme's *surface*, not
 * against the *body-text* color every other cell already renders in, and on
 * `ocean`/`meadow` those two land close enough to be indistinguishable. See
 * style.css's comment on `.category-highlight` for the measured contrast
 * numbers and the reasoning. Applied to the category (name) column only.
 */
const HIGHLIGHT_NAME_CLASS = "category-highlight";

/**
 * The per-booking-type rows — excluding the account's Buy and Sell types,
 * which are pinned at the end instead (see {@link summaryEntries}) — sorted
 * alphabetically by name. This is what the table paginates.
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
  const bookingTypes = records.bookingTypes.items;

  return sums
      .map((entry, i): AccountEntry & { role: string } => ({
        id: i,
        name: entry.value,
        sum: entry.key,
        nameClass: "",
        sumClass: entry.key < 0 ? "color-red" : "",
        // aggregateBookingsPerType maps 1:1 over the `bookingTypes` array it is
        // given (same store, same order, both here and in accounting.ts), so
        // index `i` into `sums` always corresponds to index `i` into
        // `bookingTypes`.
        role: bookingTypes[i]?.cRole ?? BOOKING_TYPE_ROLE.OTHER
      }))
      .filter((entry) => entry.role !== BOOKING_TYPE_ROLE.BUY && entry.role !== BOOKING_TYPE_ROLE.SELL)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({role: _role, ...entry}): AccountEntry => entry);
});

/**
 * The account's Buy/Sell rows, plus (for a depot account) Taxes and Fees,
 * plus the Sum row — pinned below the paginated body on every page, in that
 * order. Buy, Sell, Fees and Taxes carry {@link HIGHLIGHT_NAME_CLASS} on
 * their category cell so they stand out as the rows always found at the end
 * of the table, whichever page is showing.
 *
 * Ids continue past `accountEntries`' range so the two sets never collide — they
 * are rendered separately now, but the hidden id cell still shows them and a
 * duplicate would be confusing.
 */
const summaryEntries = computed(() => {
  const {sums, taxes, fees} = getAccountData(selected.value);
  const bookingTypes = records.bookingTypes.items;
  const finalSum = sums.reduce((acc, entry) => acc + entry.key, 0);

  const buySellEntries: Omit<AccountEntry, "id">[] = [BOOKING_TYPE_ROLE.BUY, BOOKING_TYPE_ROLE.SELL]
      .flatMap((role) => sums.filter((_entry, i) => bookingTypes[i]?.cRole === role))
      .map((entry) => ({
        name: entry.value,
        sum: entry.key,
        nameClass: HIGHLIGHT_NAME_CLASS,
        sumClass: entry.key < 0 ? "color-red" : ""
      }));

  const result: Omit<AccountEntry, "id">[] = [...buySellEntries];

  // See resolveAccountingTotal's doc comment for why this is gated on the
  // figures themselves rather than on `records.isDepot`.
  const {showTaxesAndFees, total} = resolveAccountingTotal(finalSum, taxes, fees);

  if (showTaxesAndFees) {
    result.push({
      name: t("components.dialogs.showAccounting.fees"),
      sum: fees,
      nameClass: HIGHLIGHT_NAME_CLASS,
      sumClass: "color-red"
    });
    result.push({
      name: t("components.dialogs.showAccounting.taxes"),
      sum: taxes,
      nameClass: HIGHLIGHT_NAME_CLASS,
      sumClass: "color-red"
    });
  }
  result.push({
    name: t("components.dialogs.showAccounting.sum"),
    sum: total,
    nameClass: "font-weight-bold",
    // Bold always; red too when negative — the same rule accountEntries
    // applies per row (entry.key < 0 above), just missing here before.
    sumClass: total < 0 ? "font-weight-bold color-red" : "font-weight-bold"
  });

  return result.map((entry, i): AccountEntry => ({id: sums.length + i, ...entry}));
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

<style scoped>
/*
 * Hides only the "1-5 of 5" item-range readout in the table footer — Vuetify's
 * default `dataFooter.pageText` ("{0}-{1} of {2}" / German "{0}-{1} von {2}"),
 * not a page count. There is no prop to turn off just this piece (only
 * `hide-default-footer`, which would also remove the items-per-page selector
 * and the prev/next pagination controls this table still needs when a
 * booking-type count exceeds a page). `:deep()` is required because
 * `.v-data-table-footer__info` is rendered inside VDataTable's own child
 * component, outside this component's own template.
 */
:deep(.v-data-table-footer__info) {
  display: none;
}
</style>
