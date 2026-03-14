<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {log} from "@/domains/utils/utils";
import {bookingTypesRepository} from "@/services/database/repositories";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import {useBookingTypeForm} from "@/composables/useForms";
import {alertService} from "@/services/alert";

const {bookingTypeFormData, reset} = useBookingTypeForm();
const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const records = useRecordsStore();
const runtime = useRuntimeStore();

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
      if (!canDeleteBookingType(bookingTypeId)) {
        await alertService.feedbackInfo(t("components.dialogs.deleteBookingType.title"), t("components.dialogs.deleteBookingType.messages.noDelete"));
        return;
      }

      records.bookingTypes.remove(bookingTypeId);
      await bookingTypesRepository.delete(bookingTypeId);
      runtime.resetTeleport();
      await alertService.feedbackInfo(t("components.dialogs.deleteBookingType.title"), t("components.dialogs.deleteBookingType.messages.success"));
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
