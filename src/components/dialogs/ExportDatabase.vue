<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Dialog that exports the current database into a JSON backup.
 * Coordinates with the database service and provides user feedback via alerts
 * and notices. Closes itself via the dialog hub on success or cancel.
 */
//import { computed } from "vue";
import {useI18n} from "vue-i18n";
import {useRuntimeStore} from "@/stores/runtime";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import {useAlert} from "@/composables/useAlert";
import {
  useAccountsDB,
  useBookingsDB,
  useBookingTypesDB,
  useStocksDB
} from "@/composables/useIndexedDB";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {ImportExportService} from "@/services/importExport";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/types";
import {DEFAULTS} from "@/configs/defaults";
import {INDEXED_DB} from "@/configs/database";

const {t} = useI18n();
const {showSystemNotification, manifest, writeBufferToFile} = useBrowser();
const {handleUserConfirm, handleUserError} = useAlert();
const {getAll: getAllAccounts} = useAccountsDB();
const {getAll: getAllBookings} = useBookingsDB();
const {getAll: getAllBookingTypes} = useBookingTypesDB();
const {getAll: getAllStocks} = useStocksDB();
const {isLoading, withLoading} = useDialogGuards();
const {resetTeleport} = useRuntimeStore();

const exportService = new ImportExportService();

const prefix = new Date().toISOString().substring(0, 10);
const filename = `${prefix}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;

const validateExportData = (
    accounts: AccountDb[],
    bookings: BookingDb[],
    stocks: StockDb[],
    bookingTypes: BookingTypeDb[]
): string[] => {
  const errors: string[] = [];

  if (accounts.length === 0) {
    errors.push(t("components.dialogs.exportDatabase.messages.noAccounts"));
  }

  // Check for data consistency
  const accountIds = new Set(accounts.map((a) => a.cID));

  const invalidBookings = bookings.filter(
      (b) => !accountIds.has(b.cAccountNumberID)
  );
  if (invalidBookings.length > 0) {
    errors.push(
        t("components.dialogs.exportDatabase.messages.invalidBookings", {
          count: invalidBookings.length
        })
    );
  }

  const invalidStocks = stocks.filter(
      (s) => !accountIds.has(s.cAccountNumberID)
  );
  if (invalidStocks.length > 0) {
    errors.push(
        t("components.dialogs.exportDatabase.messages.invalidStocks", {
          count: invalidStocks.length
        })
    );
  }

  const invalidBookingTypes = bookingTypes.filter(
      (b) => !accountIds.has(b.cAccountNumberID)
  );
  if (invalidBookingTypes.length > 0) {
    errors.push(
        t("components.dialogs.exportDatabase.messages.invalidBookingTypes", {
          count: invalidBookingTypes.length
        })
    );
  }

  return errors;
};

const createExportData = async (): Promise<string> => {
  const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
    getAllAccounts(),
    getAllBookings(),
    getAllStocks(),
    getAllBookingTypes()
  ]);

  const validationErrors = validateExportData(
      accounts,
      bookings,
      stocks,
      bookingTypes
  );
  if (validationErrors.length > 0) {
    throw new AppError(
        ERROR_CODES.EXPORT_DATABASE.A,
        ERROR_CATEGORY.DATABASE,
        false
    );
  }
  const metaData = {
    cVersion: Number.parseInt(manifest.value.version.replace(/\./g, "")),
    cDBVersion: INDEXED_DB.CURRENT_VERSION,
    cEngine: "indexeddb"
  };
  const dataString = exportService.stringifyDatabase(
      metaData,
      accounts,
      stocks,
      bookingTypes,
      bookings
  );
  const verification = exportService.verifyExportIntegrity(dataString);
  if (!verification.valid) {
    throw new AppError(
        ERROR_CODES.EXPORT_DATABASE.B,
        ERROR_CATEGORY.DATABASE,
        false
    );
  }
  return `\n${dataString}`;
};

const estimateExportSize = (data: string): number => {
  // Estimate size in KB
  return new TextEncoder().encode(data).length / 1024;
};

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS ExportDatabase: onClickOk");

  await withLoading(async () => {
    try {
      const exportData = await createExportData();
      const estimatedSize = estimateExportSize(exportData);

      if (estimatedSize > DEFAULTS.LARGE_FILE_THRESHOLD_KB) {
        const proceed = await handleUserConfirm(
            t("components.dialogs.exportDatabase.largeFileTitle"),
            [
              t("components.dialogs.exportDatabase.messages.estimatedSize", {
                size: estimatedSize.toFixed(2)
              })
            ],
            {
              confirm: {
                confirmText: t("components.dialogs.exportDatabase.continue"),
                cancelText: t("components.dialogs.exportDatabase.cancel"),
                type: "warning"
              }
            }
        );

        if (!proceed) {
          return;
        }
      } else {
        await showSystemNotification(
            t("components.dialogs.exportDatabase.largeFileTitle"),
            "ExportDatabase"
        );
      }
      await writeBufferToFile(exportData, filename);

      resetTeleport();
    } catch (err) {
      await handleUserError(t("components.dialogs.exportDatabase.title"), err, {
        data: "EXPORT_DATABASE"
      });
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.exportDatabase.title")
});

DomainUtils.log("COMPONENTS DIALOGS ExportDatabase: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-textarea
            :disabled="true"
            :model-value="t('components.dialogs.exportDatabase.text', { filename })"
            variant="outlined"/>
      </v-card-text>
    </v-card>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
