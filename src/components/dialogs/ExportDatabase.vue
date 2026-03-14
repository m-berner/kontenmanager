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
import {useI18n} from "vue-i18n";
import {useRuntimeStore} from "@/stores/runtime";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import {browserService} from "@/services/browserService";
import {alertService} from "@/services/alert";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {importExportService} from "@/services/importExport";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/types";
import {ERROR_CATEGORY, INDEXED_DB} from "@/constants";
import {
  accountsRepository,
  bookingsRepository,
  bookingTypesRepository,
  stocksRepository
} from "@/services/database/repositories";

const LARGE_FILE_THRESHOLD_KB = 10000;

const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const {resetTeleport} = useRuntimeStore();

const prefix = new Date().toISOString().substring(0, 10);
const filename = `${prefix}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
const dialogText = t('components.dialogs.exportDatabase.text', {filename})

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
    accountsRepository.findAll(),
    bookingsRepository.findAll(),
    stocksRepository.findAll(),
    bookingTypesRepository.findAll()
  ]);

  const validationErrors = validateExportData(
      accounts,
      bookings,
      stocks,
      bookingTypes
  );
  if (validationErrors.length > 0) {
    throw appError(
        ERROR_DEFINITIONS.EXPORT_DATABASE.A.CODE,
        ERROR_CATEGORY.DATABASE,
        false
    );
  }
  const metaData = {
    cVersion: Number.parseInt(browserService.manifest().version.replace(/\./g, "")),
    cDBVersion: INDEXED_DB.CURRENT_VERSION,
    cEngine: "indexeddb"
  };
  const dataString = importExportService.stringifyDatabase(
      metaData,
      accounts,
      stocks,
      bookingTypes,
      bookings
  );
  const verification = importExportService.verifyExportIntegrity(dataString);
  if (!verification.valid) {
    throw appError(
        ERROR_DEFINITIONS.EXPORT_DATABASE.B.CODE,
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
  log("COMPONENTS DIALOGS ExportDatabase: onClickOk");

  await submitGuard({
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.exportDatabase.title"),
    errorContext: "EXPORT_DATABASE",
    operation: async () => {
      const exportData = await createExportData();
      const estimatedSize = estimateExportSize(exportData);

      if (estimatedSize > LARGE_FILE_THRESHOLD_KB) {
        const proceed = await alertService.feedbackConfirm(
            t("components.dialogs.exportDatabase.largeFileTitle"),
            [
              t("components.dialogs.exportDatabase.messages.toBig", {
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
        await alertService.feedbackInfo(
            t("components.dialogs.exportDatabase.largeFileTitle"),
            t("components.dialogs.exportDatabase.messages.estimatedSize", {
              size: estimatedSize.toFixed(2)
            })
        );
      }
      await browserService.writeBufferToFile(exportData, filename);

      resetTeleport();
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.exportDatabase.title")
});

log("COMPONENTS DIALOGS ExportDatabase: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-textarea
            :disabled="true"
            :model-value="dialogText"
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


