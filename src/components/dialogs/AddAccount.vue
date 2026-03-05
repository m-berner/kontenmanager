<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {useAccountForm} from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {BROWSER_STORAGE} from "@/domains/configs/storage";
import {databaseService} from "@/services/database/service";
import {INDEXED_DB} from "@/domains/configs/database";
import {log, normalizeBookingTypeName} from "@/domains/utils/utils";
import {browserService} from "@/services/browserService";
import {alertService} from "@/services/alert";
import {accountsRepository, bookingTypesRepository} from "@/services/database/repositories";

const {t} = useI18n();
const {setStorage} = storageAdapter();
const {accountFormData, mapAccountFormToDb, reset} = useAccountForm();
const {submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddAccount: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "ADD_ACCOUNT",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const accountData = mapAccountFormToDb();

      // 1) Run all DB writes atomically
      const result = await databaseService.transactionManager.execute(
          [INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKING_TYPES.NAME],
          "readwrite",
          async (tx: IDBTransaction) => {
            // Add the account, get the generated ID
            const accountId = await accountsRepository.save(accountData, {tx});
            if (accountId === INDEXED_DB.INVALID_ID) {
              throw new Error(t("components.dialogs.addAccount.messages.error"));
            }

            // Optionally add default booking types
            const createdTypes: {
              cID: number;
              cName: string;
              cAccountNumberID: number;
            }[] = [];
            if (accountFormData.withDepot) {
              const defaults = [
                {
                  cName: normalizeBookingTypeName(
                      t("components.dialogs.addAccount.bookingTypes.buy")
                  ),
                  cAccountNumberID: accountId
                },
                {
                  cName: normalizeBookingTypeName(
                      t("components.dialogs.addAccount.bookingTypes.sell")
                  ),
                  cAccountNumberID: accountId
                },
                {
                  cName: normalizeBookingTypeName(
                      t("components.dialogs.addAccount.bookingTypes.dividend")
                  ),
                  cAccountNumberID: accountId
                }
              ];

              for (const bt of defaults) {
                const id = await bookingTypesRepository.save(bt, {tx});
                if (id === INDEXED_DB.INVALID_ID) {
                  throw new Error(t("components.dialogs.addBookingType.messages.error"));
                }
                createdTypes.push({cID: id, ...bt});
              }
            }

            // Returning from callback does NOT commit immediately; it waits for tx complete
            return {accountId, createdTypes};
          }
      );

      const {accountId, createdTypes} = result;

      // 2) Only if the transaction completed successfully, update UI state
      const {activeAccountId} = storeToRefs(settings);
      records.accounts.add({...accountData, cID: accountId});
      for (const bt of createdTypes) records.bookingTypes.add(bt);

      activeAccountId.value = accountId;
      try {
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, accountId);
      } catch (err) {
        await alertService.feedbackError("COMPONENTS DIALOGS AddAccount", err, {});
      }
      await alertService.feedbackInfo(t("components.dialogs.addAccount.title"), t("components.dialogs.addAccount.messages.success"));
      records.clean(false);
      runtime.resetTeleport();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addAccount.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddAccount: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <AccountForm :isUpdate="false"/>
  </BaseDialogForm>
</template>

