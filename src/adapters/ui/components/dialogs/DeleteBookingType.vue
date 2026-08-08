<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";

import {deleteBookingTypeUsecase} from "@/app/usecases/bookingTypes";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BookingTypeForm from "@/adapters/ui/components/dialogs/forms/BookingTypeForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createBookingTypeFormManager, provideBookingTypeFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";

const bookingTypeForm = createBookingTypeFormManager();
provideBookingTypeFormManager(bookingTypeForm);
const {bookingTypeFormData, reset} = bookingTypeForm;
const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {databaseAdapter, alertAdapter, repositories} = useAdapters();

const canDeleteBookingType = (bookingTypeId: number): boolean => {
  return !records.bookings.hasBookingType(bookingTypeId);
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS DeleteBookingType: onClickOk");

  await submitGuard({
    // no fillable form — a selector plus a confirmation; the precondition is
    // checked inside the operation instead.
    // Declared explicitly because submitGuard's validation gate is
    // fail-closed: omitting formRef no longer means "skip validation", so an
    // accidental undefined cannot pass for a deliberate omission.
    skipValidation: true,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: t("components.dialogs.deleteBookingType.messages.dbNotConnected"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorTitle: t("components.dialogs.deleteBookingType.title"),
    errorContext: "DELETE_BOOKING_TYPE",
    operation: async () => {
      // Moved inside submitGuard: as a pre-check it sat outside the isLoading
      // reentrancy guard that protects every other dialog, so a double click
      // could fire it twice. Reading the id here also picks up a selection made
      // between the click and the operation running.
      const bookingTypeId = bookingTypeFormData.id;
      if (!bookingTypeId) {
        log("COMPONENTS DIALOGS DeleteBookingType: No booking type selected");
        await alertAdapter.feedbackInfo(
            t("components.dialogs.deleteBookingType.title"),
            t("components.dialogs.deleteBookingType.messages.noSelection")
        );
        return;
      }

      const res = await deleteBookingTypeUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {
            bookingTypeId,
            canDelete: canDeleteBookingType
          }
      );

      if (res.status === "not_allowed") {
        await alertAdapter.feedbackInfo(
            t("components.dialogs.deleteBookingType.title"),
            t("components.dialogs.deleteBookingType.messages.noDelete")
        );
        return;
      }

      await alertAdapter.feedbackInfo(
          t("components.dialogs.deleteBookingType.title"),
          t("components.dialogs.deleteBookingType.messages.success")
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteBookingType.title"),
  isLoading: () => isLoading.value
});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS DeleteBookingType: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS DeleteBookingType: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <BookingTypeForm :mode="'delete'"/>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
