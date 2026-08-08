<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {createDividendHeaders, DIALOG_ITEMS_PER_PAGE_OPTIONS} from "@/domain/constants";
import {isValidISODate, log, utcDate} from "@/domain/utils/utils";

import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {d, n, t} = useI18n();
const settings = useSettingsStore();
const setDividendsPerPage = (value: number) =>
    settings.setDividendsPerPage(value);
const {activeId} = storeToRefs(useRuntimeStore());
const records = useRecordsStore();

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
            :items="records.bookings.dividendsByStockId(activeId, records.bookingTypes.items)"
            :items-per-page="settings.dividendsPerPage"
            :items-per-page-options="DIALOG_ITEMS_PER_PAGE_OPTIONS"
            :items-per-page-text="t('components.dialogs.showDividend.itemsPerPageText')"
            :no-data-text="t('components.dialogs.showDividend.noDataText')"
            density="compact"
            item-value="id"
            @update:items-per-page="setDividendsPerPage">
          <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
              <td class="d-none">{{ item.id }}</td>
              <!--
                `item.year` is the booking's raw cExDate string. Passing a string
                straight to d() routes it through @intlify's parseDateTimeArgs,
                which THROWS (INVALID_ISO_DATE_ARGUMENT) rather than degrading when
                the value isn't a parseable ISO date - and validateBooking's
                normalizeDate() deliberately yields "" for a missing/malformed date
                (its "don't silently mutate data to today" fallback), which is
                reachable by importing a backup whose dividend row has no ex-date.
                That threw inside the render function and took the whole dialog out.
                Guard first, then hand d() a real Date - note utcDate("") returns an
                Invalid Date, and Intl.DateTimeFormat.format() throws RangeError on
                that too, so converting alone is not enough.
              -->
              <td>
                <template v-if="isValidISODate(item.exDate)">
                  {{ d(utcDate(item.exDate), "short") }}
                </template>
              </td>
              <td>{{ n(item.sum, "currency") }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-form>
</template>
