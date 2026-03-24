<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {addBookingTypeUsecase} from "@/app/usecases/bookingTypes";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import BookingTypeForm from "@/adapters/primary/components/dialogs/forms/BookingTypeForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createBookingTypeFormManager, provideBookingTypeFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const records = useRecordsStore();
const {activeAccountId} = useSettingsStore();
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const bookingTypeForm = createBookingTypeFormManager();
provideBookingTypeFormManager(bookingTypeForm);
const {mapBookingTypeFormToDb, reset} = bookingTypeForm;
const {submitGuard} = useDialogGuards(t);
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddBookingType: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const bookingTypeData = mapBookingTypeFormToDb(activeAccountId);
      const res = await addBookingTypeUsecase(
          {repositories, records: toRecordsPort(records)},
          {
            bookingTypeData,
            isDuplicateName: (name) => records.bookingTypes.isDuplicate(name)
          }
      );

      if (res.status === "duplicate") {
        await alertAdapter.feedbackInfo(
            t("components.dialogs.addBookingType.title"),
            t("components.dialogs.addBookingType.messages.duplicate")
        );
        return;
      }

      await alertAdapter.feedbackInfo(
          t("components.dialogs.addBookingType.title"),
          t("components.dialogs.addBookingType.messages.success")
      );
      reset();
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.addBookingType.title")
});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddBookingType: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingTypeForm :mode="'add'"/>
  </BaseDialogForm>
</template>
