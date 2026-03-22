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

import {useServices} from "@/adapters/context";
import BookingTypeForm from "@/adapters/primary/components/dialogs/forms/BookingTypeForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createBookingTypeFormManager, provideBookingTypeFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

const bookingTypeForm = createBookingTypeFormManager();
provideBookingTypeFormManager(bookingTypeForm);
const {bookingTypeFormData, reset} = bookingTypeForm;
const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {databaseService, alertService, repositories} = useServices();

const canDeleteBookingType = (bookingTypeId: number): boolean => {
  return !records.bookings.hasBookingType(bookingTypeId);
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS DeleteBookingType: onClickOk");

  const bookingTypeId = bookingTypeFormData.id;
  if (!bookingTypeId) {
    log("COMPONENTS DIALOGS DeleteBookingType: No booking type selected");
    return;
  }

  await submitGuard({
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t("components.dialogs.deleteBookingType.messages.dbNotConnected"),
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.deleteBookingType.title"),
    errorContext: "DELETE_BOOKING_TYPE",
    operation: async () => {
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
        await alertService.feedbackInfo(
            t("components.dialogs.deleteBookingType.title"),
            t("components.dialogs.deleteBookingType.messages.noDelete")
        );
        return;
      }

      await alertService.feedbackInfo(
          t("components.dialogs.deleteBookingType.title"),
          t("components.dialogs.deleteBookingType.messages.success")
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteBookingType.title")
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
