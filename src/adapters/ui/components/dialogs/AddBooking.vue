<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {addBookingUsecase} from "@/app/usecases/bookings";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {DATE} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import BookingForm from "@/adapters/ui/components/dialogs/forms/BookingForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createBookingFormManager, provideBookingFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const bookingForm = createBookingFormManager();
provideBookingFormManager(bookingForm);
const {mapBookingFormToDb, reset} = bookingForm;
const {submitGuard, isLoading} = useDialogGuards(t);
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {activeAccountId} = storeToRefs(useSettingsStore());
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
      const bookingData = mapBookingFormToDb(activeAccountId.value, DATE.ISO, records.bookingTypes.items);

      await addBookingUsecase(
          {repositories, records: toRecordsPort(records), runtime},
          {bookingData}
      );

      // rateLimitMs: 0 — this dialog stays open after a save precisely because
      // "bookings are typically entered several at a time" (addBookingUsecase's
      // own comment). The alert adapter's default 1500 ms window keys on
      // kind|title|message, all three of which are identical for every success
      // here, so two quick saves showed ONE confirmation — no signal at all
      // that the second write landed, in the one flow built for repetition.
      await alertAdapter.feedbackInfo(
          t("components.dialogs.addBooking.title"),
          t("components.dialogs.addBooking.messages.success"),
          {rateLimitMs: 0}
      );
      reset();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addBooking.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddBooking: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <BookingForm/>
  </BaseDialogForm>
</template>
