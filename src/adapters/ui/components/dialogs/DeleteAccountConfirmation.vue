<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";

import {deleteActiveAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {databaseAdapter, alertAdapter, storageAdapter} = useAdapters();
const {setStorage} = storageAdapter();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {isLoading, submitGuard} = useDialogGuards(t);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS DeleteAccountConfirmation: onClickOk");

  await submitGuard({
    // no fillable form — a confirmation.
    // Declared explicitly because submitGuard's validation gate is
    // fail-closed: omitting formRef no longer means "skip validation", so an
    // accidental undefined cannot pass for a deliberate omission.
    skipValidation: true,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: t("components.dialogs.deleteAccountConfirmation.messages.dbNotConnected"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorTitle: t("components.dialogs.deleteAccountConfirmation.title"),
    errorContext: "DELETE_ACCOUNT",
    operation: async () => {
      // Moved inside submitGuard, following DeleteBookingType's fix and for the
      // reason its comment gives: as a pre-check this sat outside the isLoading
      // reentrancy guard that protects every other dialog, and — the part that
      // matters here — it read the precondition at *click* time rather than at
      // operation time. This is the sharpest case of the four siblings that
      // still had the shape, because its precondition was evaluated **only**
      // outside the guard and never re-verified before the account was deleted.
      //
      // The template already renders a "no account" branch, but nothing stopped
      // OK from firing anyway: deleteActiveAccountUsecase would run against the
      // no-account sentinel, delete nothing, and then report success.
      if (!records.hasActiveAccount) {
        await alertAdapter.feedbackInfo(
            t("components.dialogs.deleteAccountConfirmation.title"),
            t("views.headerBar.messages.noAccount")
        );
        return;
      }

      await deleteActiveAccountUsecase(
          {
            databaseAdapter,
            records: toRecordsPort(records),
            settings: toSettingsPort(settings),
            runtime,
            setStorage
          },
          {
            initMessages: {
              title: t("mixed.smImportOnly.title"),
              message: t("mixed.smImportOnly.message")
            }
          }
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.deleteAccountConfirmation.title"),
          t("components.dialogs.deleteAccountConfirmation.messages.success")
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteAccountConfirmation.title"),
  isLoading: () => isLoading.value
});

log("COMPONENTS DIALOGS DeleteAccountConfirmation: setup");
</script>

<template>
  <!--
    Gated on `hasActiveAccount`, the same predicate `onClickOk` uses, not on
    `accounts.items.length === 0`. The two disagreed in exactly the state
    `hasActiveAccount` was introduced to name: "accounts exist but none is
    active" made the length test false, so this dialog presented a red "are you
    sure you want to delete this account?" confirmation and only after the user
    committed to it did the OK handler say "no account".

    `recordsHub.ts`'s own doc comment records the history: the two predicates
    "were equivalent only by accident: historically `activeAccountId === -1`
    implied zero accounts". The header-bar guards and this dialog's `onClickOk`
    were migrated to the new predicate; the template was left on the old test.
  -->
  <v-alert v-if="!records.hasActiveAccount">{{
      t("views.headerBar.messages.noAccount")
    }}
  </v-alert>
  <v-alert v-else type="warning">{{
      t("components.dialogs.deleteAccountConfirmation.messages.confirm")
    }}
  </v-alert>
  <v-overlay v-model="isLoading" class="align-center justify-center" contained>
    <v-progress-circular color="primary" indeterminate size="64"/>
  </v-overlay>
</template>
