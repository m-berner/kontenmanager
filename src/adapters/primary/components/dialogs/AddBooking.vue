<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {addBookingUsecase} from "@/app/usecases/bookings";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {DATE} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import BookingForm from "@/adapters/primary/components/dialogs/forms/BookingForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createBookingFormManager, provideBookingFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const bookingForm = createBookingFormManager();
provideBookingFormManager(bookingForm);
const {mapBookingFormToDb, reset} = bookingForm;
const {submitGuard} = useDialogGuards(t);
const records = useRecordsStore();
const {activeAccountId} = useSettingsStore();
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddBooking: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "ADD_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);

      await addBookingUsecase(
          {repositories, records: toRecordsPort(records)},
          {bookingData}
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.addBooking.title"),
          t("components.dialogs.addBooking.messages.success")
      );
      reset();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addBooking.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddBooking: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingForm/>
  </BaseDialogForm>
</template>
