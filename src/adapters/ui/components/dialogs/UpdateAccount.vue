<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {CURRENCIES} from "@/domain/constants";
import type {AccountDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import AccountForm from "@/adapters/ui/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createAccountFormManager, provideAccountFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {activeAccountId} = storeToRefs(useSettingsStore());
const runtime = useRuntimeStore();
const accountForm = createAccountFormManager();
provideAccountFormManager(accountForm);
const {accountFormData, mapAccountFormToDb} = accountForm;
const records = useRecordsStore();
const {submitGuard, isLoading} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);
// Captured at load time, before the user can edit the withDepot switch, so
// onClickOk can detect a false -> true transition (accountFormData.withDepot
// itself may have already been changed by the user by then).
const previousWithDepot = ref(false);

const loadCurrentAccount = async (): Promise<void> => {
  const currentAccount = records.accounts.getById(activeAccountId.value);

  // Bail out instead of leaving the dialog open on a blank form, mirroring
  // UpdateBooking.vue's guard — a failed lookup must not be able to turn an
  // update into an insert. The freshly-created form manager starts at
  // `id: -1`, so mapAccountFormToDb's `data.id > 0` gate is false, and it
  // returns an object with NO cID. validateAccount rebuilds that as `cID: 0`,
  // baseRepository.save() reads 0 as "not an update" and `store.add()`s a
  // SECOND account — while records.accounts.update() no-ops (nothing has
  // cID 0), so the duplicate stays invisible until the next reload.
  //
  // useHeaderBarActions gates this dialog behind records.hasActiveAccount,
  // which performs the same lookup, so this is defense in depth against the
  // window between that check and this one — and against any future call site
  // that opens the dialog without the guard (useMenu.ts's updateAccount
  // handler has none today; it is simply not wired to a menu).
  if (!currentAccount) {
    await alertAdapter.feedbackError(
        t("components.dialogs.updateAccount.title"),
        browserAdapter.getMessage("xx_missing_record"),
        {data: {activeAccountId: activeAccountId.value}}
    );
    runtime.resetTeleport();
    return;
  }

  previousWithDepot.value = currentAccount.cWithDepot;
  Object.assign(accountFormData, {
    id: currentAccount.cID,
    swift: currentAccount.cSwift,
    iban: currentAccount.cIban,
    logoUrl: currentAccount.cLogoUrl,
    withDepot: currentAccount.cWithDepot,
    // `?? EUR` even though `cCurrency` is declared required: schema migration 29
    // stamps it onto every stored row, but a row that predates the migration in
    // some other way (a hand-written record, a test double) would otherwise put
    // `undefined` into the select and render it blank.
    currency: currentAccount.cCurrency ?? CURRENCIES.EUR
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateAccount: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_ACCOUNT",
    errorTitle: t("components.dialogs.updateAccount.title"),
    operation: async () => {
      const account = mapAccountFormToDb() as AccountDb;
      await updateAccountUsecase(
          {
            databaseAdapter,
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {
            account,
            previousWithDepot: previousWithDepot.value,
            bookingTypeLabels: {
              buy: t("components.dialogs.addAccount.bookingTypes.buy"),
              sell: t("components.dialogs.addAccount.bookingTypes.sell"),
              dividend: t("components.dialogs.addAccount.bookingTypes.dividend")
            }
          }
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.updateAccount.title"),
          t("components.dialogs.updateAccount.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateAccount.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateAccount: onBeforeMount");
  void loadCurrentAccount();
});

log("COMPONENTS DIALOGS UpdateAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <AccountForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
