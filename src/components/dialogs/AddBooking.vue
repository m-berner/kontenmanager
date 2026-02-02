<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useUserInfo } from "@/composables/useUserInfo";
import { useBookingsDB } from "@/composables/useIndexedDB";
import { useBookingForm } from "@/composables/useForms";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { DATE } from "@/domains/config/date";
import { databaseService } from "@/services/database";
import type { FormInterface } from "@/types";

const { t } = useI18n();
const { add } = useBookingsDB();
const { mapBookingFormToDb, reset } = useBookingForm();
const { isLoading, submitGuard } = useDialogGuards();
const { handleUserInfo } = useUserInfo();
const records = useRecordsStore();
const { activeAccountId } = useSettingsStore();
const formRef = ref<FormInterface | null>(null);

const onClickOk = async (): Promise<void> => {
  await handleUserInfo("console", "AddBooking", "onClickOk", {
    logLevel: "log"
  });
  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.addBooking.messages.dbNotConnected"
    ),
    handleUserInfo,
    errorContext: "ADD_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);
      const addBookingID = await add(bookingData);

      if (addBookingID === -1) {
        await handleUserInfo("notice", "AddBooking", "onClickOk: done", {
          noticeLines: [t("components.dialogs.addBooking.messages.error")]
        });
        return;
      }

      records.bookings.add({ ...bookingData, cID: addBookingID }, true);
      reset();
      await handleUserInfo("notice", "AddBooking", "onClickOk: done", {
        noticeLines: [t("components.dialogs.addBooking.messages.success")]
      });
    }
  });
};

defineExpose({ onClickOk, title: t("components.dialogs.addBooking.title") });

onBeforeMount(() => {
  handleUserInfo("console", "AddBooking", "onBeforeMount", {
    logLevel: "log"
  });
  reset();
});

handleUserInfo("console", "AddBooking", "--- vue setup ---", {
  logLevel: "log"
});
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <BookingForm />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
