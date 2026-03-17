<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Dialog that imports a JSON backup into IndexedDB.
 * Validates the file, runs integrity checks, executes an atomic import, and
 * reports results via the alert overlay. Offers creating defaults when needed.
 */
import type {BackupData, BookingDb, RecordOperation, RollbackData, StockDb} from "@/types";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {browserService} from "@/services/browserService";
import {alertService} from "@/services/alert";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {isAppError} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {useAccountsDB} from "@/composables/useIndexedDB";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {importExportService} from "@/services/importExport";
import {BROWSER_STORAGE, INDEXED_DB} from "@/constants";
import {validateBooking} from "@/domains/validation/validators";

const SM_RESTORE_ACCOUNT_ID = 1;

const {t} = useI18n();
const {setStorage} = storageAdapter();
const {atomicImport} = useAccountsDB();
const {isLoading, submitGuard} = useDialogGuards(t);
const {resetTeleport} = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();

const files = ref<File[] | File | null>(null);
const fileBlob = ref<Blob>(new Blob());
const fileInputKey = ref(0);
//const importService = new ImportExportService();

const isFileSelected = computed(() => fileBlob.value.size > 0);

const resetFileInput = () => {
  fileBlob.value = new Blob();
  files.value = null;
  fileInputKey.value++; // Force component re-render
};

const validateFile = (file: File): string | null => {
  if (file.size === 0)
    return t("components.dialogs.importDatabase.messages.emptyFile");
  if (file.size > INDEXED_DB.MAX_FILE_SIZE)
    return t("components.dialogs.importDatabase.messages.fileToLarge");
  if (!file.name.endsWith(".json"))
    return t("components.dialogs.importDatabase.messages.invalidSuffix");
  return null;
};

const onChange = async (selectedFile: File | File[] | null): Promise<void> => {
  if (selectedFile === null) {
    fileBlob.value = new Blob();
    return;
  }

  const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile;
  if (!file) {
    fileBlob.value = new Blob();
    return;
  }

  const validationError = validateFile(file);

  if (validationError) {
    await browserService.showSystemNotification(
        t("components.dialogs.importDatabase.title"),
        browserService.getMessage("xx_invalid_backup")
    );
    resetFileInput();
    return;
  }

  fileBlob.value = file;
};

const createDefaultAccount = (activeId: number) => ({
  cID: activeId,
  cSwift: "KMKLPJJ9",
  cIban: "XX13120300001064506999",
  cLogoUrl: "",
  cWithDepot: true
});

const createDefaultBookingTypes = (activeId: number) => {
  const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

  const typeMapping: { cID: number; cName: string }[] = [
    {
      cID: BOOKING_TYPES.BUY,
      cName: t("components.dialogs.importDatabase.buy")
    },
    {
      cID: BOOKING_TYPES.SELL,
      cName: t("components.dialogs.importDatabase.sell")
    },
    {
      cID: BOOKING_TYPES.DIVIDEND,
      cName: t("components.dialogs.importDatabase.dividend")
    },
    {
      cID: BOOKING_TYPES.CREDIT,
      cName: t("components.dialogs.importDatabase.other")
    },
    {
      cID: BOOKING_TYPES.DEBIT,
      cName: t("components.dialogs.importDatabase.fee")
    },
    {
      cID: BOOKING_TYPES.TAX,
      cName: t("components.dialogs.importDatabase.tax")
    }
  ];

  return typeMapping.map((rec) => ({
    cID: rec.cID,
    cName: rec.cName,
    cAccountNumberID: activeId
  }));
};

const toImportRecords = <T, >(data: T[]): RecordOperation[] =>
    data.map((rec) => ({type: "add" as const, data: rec, key: -1}));

const importLegacyData = async (
    backup: BackupData,
    activeId: number
): Promise<void> => {
  const accountsImportData: RecordOperation[] = [];
  const bookingsImportData: RecordOperation[] = [];
  const bookingTypesImportData: RecordOperation[] = [];
  const stocksImportData: RecordOperation[] = [];

  // Create default account and booking types
  const account = createDefaultAccount(activeId);
  accountsImportData.push({type: "add", data: account, key: -1});

  const bookingTypes = createDefaultBookingTypes(activeId);
  for (const bt of bookingTypes) {
    bookingTypesImportData.push({type: "add", data: bt, key: -1});
  }

  // Transform stocks
  if (backup.stocks && Array.isArray(backup.stocks)) {
    for (const rec of backup.stocks) {
      const stock = importExportService.transformLegacyStock(rec, activeId);
      stocksImportData.push({type: "add", data: stock, key: -1});
    }
  }

  // Transform bookings
  if (backup.transfers) {
    for (let i = 0; i < (backup.transfers?.length ?? 0); i++) {
      const booking = importExportService.transformLegacyBooking(
          backup.transfers[i],
          i,
          activeId
      );
      bookingsImportData.push({
        type: "add",
        data: validateBooking(booking),
        key: -1
      });
    }
  }

  // Import all data with logging
  await atomicImport([
    {
      storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
      operations: [{type: "clear"}, ...accountsImportData]
    },
    {
      storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      operations: [{type: "clear"}, ...bookingTypesImportData]
    },
    {
      storeName: INDEXED_DB.STORE.STOCKS.NAME,
      operations: [{type: "clear"}, ...stocksImportData]
    },
    {
      storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
      operations: [{type: "clear"}, ...bookingsImportData]
    }
  ]);

  // Initialize records store
  records.init(
      {
        accountsDB: [account],
        bookingsDB: bookingsImportData
            .map((r) => r.data as BookingDb)
            .filter((b) => b.cAccountNumberID === activeId),
        bookingTypesDB: bookingTypes,
        stocksDB: stocksImportData
            .map((r) => r.data as StockDb)
            .filter((s) => s.cAccountNumberID === activeId)
      },
      {
        title: t("mixed.smImportOnly.title"),
        message: t("mixed.smImportOnly.message")
      }
  );
};

const importModernData = async (
    backup: BackupData,
    activeId: number
): Promise<void> => {
  // Validation already done in processBackupFile, so remove duplicate check
  const safeBackup = structuredClone(backup);
  safeBackup.bookings = (safeBackup.bookings || []).map((b) =>
      validateBooking(b)
  );

  await atomicImport([
    {
      storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
      operations: [{type: "clear"}, ...toImportRecords(safeBackup.accounts)]
    },
    {
      storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      operations: [
        {type: "clear"},
        ...toImportRecords(safeBackup.bookingTypes)
      ]
    },
    {
      storeName: INDEXED_DB.STORE.STOCKS.NAME,
      operations: [{type: "clear"}, ...toImportRecords(safeBackup.stocks)]
    },
    {
      storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
      operations: [{type: "clear"}, ...toImportRecords(safeBackup.bookings)]
    }
  ]);

  records.init(
      {
        accountsDB: safeBackup.accounts,
        bookingsDB: safeBackup.bookings.filter(
            (rec) => rec.cAccountNumberID === activeId
        ),
        bookingTypesDB: safeBackup.bookingTypes.filter(
            (rec) => rec.cAccountNumberID === activeId
        ),
        stocksDB: safeBackup.stocks.filter(
            (rec) => rec.cAccountNumberID === activeId
        )
      },
      {
        title: t("mixed.smImportOnly.title"),
        message: t("mixed.smImportOnly.message")
      }
  );
};

const createRollbackPoint = async (): Promise<RollbackData | null> => {
  try {
    return {
      accounts: [...records.accounts.items],
      stocks: [...records.stocks.items],
      bookingTypes: [...records.bookingTypes.items],
      bookings: [...records.bookings.items],
      activeAccountId: settings.activeAccountId
    };
  } catch (err) {
    const errorMessage =
        isAppError(err)
            ? err.message
            : err instanceof Error
                ? err.message
                : "Unknown error";
    log("COMPONENTS DIALOGS ImportDatabase: Failed to create the rollback point", errorMessage);
    return null;
  }
};

const restoreFromRollback = async (
    rollbackData: RollbackData
): Promise<void> => {
  try {
    log("COMPONENTS DIALOGS ImportDatabase: Starting rollback");

    await atomicImport([
      {
        storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
        operations: [
          {type: "clear"},
          ...toImportRecords(rollbackData.accounts)
        ]
      },
      {
        storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
        operations: [
          {type: "clear"},
          ...toImportRecords(rollbackData.bookingTypes)
        ]
      },
      {
        storeName: INDEXED_DB.STORE.STOCKS.NAME,
        operations: [{type: "clear"}, ...toImportRecords(rollbackData.stocks)]
      },
      {
        storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
        operations: [
          {type: "clear"},
          ...toImportRecords(rollbackData.bookings)
        ]
      }
    ]);

    settings.activeAccountId = rollbackData.activeAccountId;
    await setStorage(
        BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
        rollbackData.activeAccountId
    );

    records.init(
        {
          accountsDB: rollbackData.accounts,
          bookingsDB: rollbackData.bookings.map((b) =>
              validateBooking(b)
          ),
          bookingTypesDB: rollbackData.bookingTypes,
          stocksDB: rollbackData.stocks
        },
        {
          title: t("mixed.smImportOnly.title"),
          message: t("mixed.smImportOnly.message")
        }
    );

    log("COMPONENTS DIALOGS ImportDatabase: Rollback completed successfully");
  } catch (err) {
    await alertService.feedbackError(t("components.dialogs.importDatabase.title"), err, {
      data: "Rollback failed"
    });
  }
};

const getImportSummary = (backup: BackupData): string => {
  const isLegacy = backup.sm.cDBVersion === INDEXED_DB.LEGACY_IMPORT_VERSION;

  if (isLegacy) {
    return [
      `1 ${t("components.dialogs.importDatabase.messages.importInfo.account")}`,
      `${backup.stocks?.length ?? 0} ${t(
          "components.dialogs.importDatabase.messages.importInfo.stock"
      )}`,
      `${backup.transfers?.length ?? 0} ${t(
          "components.dialogs.importDatabase.messages.importInfo.booking"
      )}`,
      `6 ${t(
          "components.dialogs.importDatabase.messages.importInfo.bookingType"
      )}`
    ].join("\n");
  }

  return [
    `${backup.accounts?.length ?? 0} ${t(
        "components.dialogs.importDatabase.messages.importInfo.account"
    )}`,
    `${backup.stocks?.length ?? 0} ${t(
        "components.dialogs.importDatabase.messages.importInfo.stock"
    )}`,
    `${backup.bookings?.length ?? 0} ${t(
        "components.dialogs.importDatabase.messages.importInfo.booking"
    )}`,
    `${backup.bookingTypes?.length ?? 0} ${t(
        "components.dialogs.importDatabase.messages.importInfo.bookingType"
    )}`
  ].join("\n");
};

const processBackupFile = async (): Promise<void> => {
  //const startTime = Date.now();
  const originalActiveId = settings.activeAccountId;

  try {
    const backup = await importExportService.readJsonFile(fileBlob.value);
    const validation = importExportService.validateBackup(backup);
    // Use type guard
    if (!validation.isValid) {
      await alertService.feedbackError(
          "COMPONENTS DIALOGS ImportDatabase",
          browserService.getMessage("xx_invalid_backup"), {}
      );
      return;
    }
    // Check for empty database requirement
    if (
        validation.version === INDEXED_DB.LEGACY_IMPORT_VERSION &&
        records.accounts.items.length > 0
    ) {
      await browserService.showSystemNotification(
          t("components.dialogs.importDatabase.title"),
          browserService.getMessage("xx_db_restored")
      );
      return;
    }
    // Check data integrity for both legacy and modern
    let dataIntegrityErrors: string[] = [];

    if (validation.version === INDEXED_DB.LEGACY_IMPORT_VERSION) {
      dataIntegrityErrors = importExportService.validateLegacyDataIntegrity(backup);
    } else {
      dataIntegrityErrors = importExportService.validateDataIntegrity(backup);
    }

    if (dataIntegrityErrors.length > 0) {
      const shownErrors = dataIntegrityErrors.slice(0, 5);
      if (dataIntegrityErrors.length > 5) {
        shownErrors.push(`...and ${dataIntegrityErrors.length - 5} more`);
      }

      await alertService.feedbackError(
          t("components.dialogs.importDatabase.title"),
          shownErrors,
          {data: {count: dataIntegrityErrors.length}}
      );

      resetTeleport();
      return;
    }

    // Show confirmation before import
    const summary = getImportSummary(backup);

    const shouldProceed = await alertService.feedbackConfirm(
        t("components.dialogs.importDatabase.confirmImportTitle"),
        summary,
        {
          confirm: {
            confirmText: t("components.dialogs.importDatabase.confirmOk"),
            cancelText: t("components.dialogs.importDatabase.confirmCancel"),
            type: "warning"
          }
        }
    );

    if (!shouldProceed) {
      return;
    }
    // Set the active account
    const activeId = backup.accounts?.[0].cID ?? SM_RESTORE_ACCOUNT_ID;
    settings.activeAccountId = activeId;
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeId);
    // Import based on the version
    if (backup.sm.cDBVersion === INDEXED_DB.LEGACY_IMPORT_VERSION) {
      await importLegacyData(backup, activeId);
    } else if (backup.sm.cDBVersion > INDEXED_DB.LEGACY_IMPORT_VERSION) {
      await importModernData(backup, activeId);
    } else {
      await alertService.feedbackInfo(
          t("components.dialogs.importDatabase.title"),
          browserService.getMessage("xx_db_no_restored")
      );
      settings.activeAccountId = originalActiveId;
      await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
      return;
    }
    resetTeleport();
    // At the end of the processBackupFile, after successful import
    //const duration = Date.now() - startTime;

    await alertService.feedbackInfo("", summary);
    resetFileInput();
  } catch (err) {
    settings.activeAccountId = originalActiveId;
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
    const errorMessage =
        isAppError(err)
            ? err.message
            : err instanceof Error
                ? err.message
                : "Unknown error";
    await alertService.feedbackError(t("components.dialogs.importDatabase.title"), errorMessage, {
      data: "IMPORT_DATABASE_PROCESS"
    });
  }
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS ImportDatabase: onClickOk");

  if (!isFileSelected) {
    await alertService.feedbackInfo(
        t("components.dialogs.importDatabase.title"),
        browserService.getMessage("xx_db_no_file")
    );
    return;
  }

  await submitGuard({
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.importDatabase.title"),
    errorContext: "IMPORT_DATABASE",
    operation: async () => {
      const rollbackData = await createRollbackPoint();

      if (!rollbackData) {
        await alertService.feedbackInfo(
            t("components.dialogs.importDatabase.title"),
            browserService.getMessage("xx_db_no_rollback")
        );
        return;
      }

      try {
        await processBackupFile();
      } catch (err) {
        try {
          await restoreFromRollback(rollbackData);
          await alertService.feedbackInfo(
              t("components.dialogs.importDatabase.title"),
              browserService.getMessage("xx_db_rollback")
          );
        } catch (rollbackErr) {
          await alertService.feedbackError(
              t("components.dialogs.importDatabase.title"),
              rollbackErr, {}
          );
        }
        throw err;
      }
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.importDatabase.title")
});

log("COMPONENTS DIALOGS ImportDatabase: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          :label="t('components.dialogs.importDatabase.messageDelete')"
          readonly
          variant="plain"/>
      <v-file-input
          :key="fileInputKey"
          v-model="files"
          :clearable="true"
          :label="t('components.dialogs.importDatabase.fileLabel')"
          :show-size="true"
          accept=".json"
          prepend-icon="$fileUpload"
          variant="outlined"
          @update:model-value="onChange"/>
    </v-card-text>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>


