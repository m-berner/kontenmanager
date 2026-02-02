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
import { UtilsService } from "@/domains/utils";
import { useUserInfo } from "@/composables/useUserInfo";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { useBookingTypeForm } from "@/composables/useForms";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import type { FormInterface } from "@/types";
import { useSettingsStore } from "@/stores/settings";

const { t } = useI18n();
const { handleUserInfo } = useUserInfo();
const { add } = useBookingTypesDB();
const records = useRecordsStore();
const { activeAccountId } = useSettingsStore();
const { bookingTypeFormData, mapBookingTypeFormToDb, reset } =
  useBookingTypeForm();
const { isLoading, submitGuard } = useDialogGuards();
const formRef = ref<FormInterface | null>(null);

const onClickOk = async (): Promise<void> => {
  UtilsService.log("ADD_BOOKING_TYPE: onClickOk");

  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.addBookingType.messages.dbNotConnected"
    ),
    handleUserInfo,
    errorContext: "BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (records.bookingTypes.isDuplicate(bookingTypeFormData.name)) {
        await handleUserInfo(
          "notice",
          "AddBookingType",
          "duplicate",
          { noticeLines: [t("components.dialogs.addBookingType.messages.error")] }
        );
        return;
      }
      const bookingTypeData = mapBookingTypeFormToDb(activeAccountId);
      const addBookingTypeID = await add(bookingTypeData);
      if (addBookingTypeID === -1) {
        UtilsService.log("ADD_BOOKING_TYPE: Failed to create booking type");
        await handleUserInfo(
          "notice",
          "AddBookingType",
          "add failed",
          { noticeLines: [t("components.dialogs.addBookingType.messages.error")] }
        );
        return;
      }

      records.bookingTypes.add({ ...bookingTypeData, cID: addBookingTypeID });
      reset();
      await handleUserInfo(
        "notice",
        "AddBookingType",
        "success",
        { noticeLines: [t("components.dialogs.addBookingType.messages.success")] }
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.addBookingType.title")
});

onBeforeMount(() => {
  UtilsService.log("ADD_BOOKING_TYPE: onBeforeMount");
  reset();
});

UtilsService.log("--- AddBookingType.vue setup ---");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <BookingTypeForm :mode="'add'" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
