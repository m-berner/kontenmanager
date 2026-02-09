<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type { BookingTypeDb, FormInterface } from "@/types";
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { useBookingTypeForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";

const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { update } = useBookingTypesDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const { activeId } = storeToRefs(runtime);
const {
  bookingTypeFormData,
  mapBookingTypeFormToDb,
  reset: resetForm
} = useBookingTypeForm();
const { isLoading, submitGuard } = useDialogGuards();
const { activeAccountId } = useSettingsStore();
const formRef = ref<FormInterface | null>(null);

const loadCurrentBookingType = (): void => {
  DomainUtils.log("UPDATE_BOOKING_TYPE: loadCurrentBookingType");
  resetForm();
  const currentBookingType = records.bookingTypes.getById(activeId.value);
  if (!currentBookingType) return;

  bookingTypeFormData.id = activeId.value;
  bookingTypeFormData.name = currentBookingType.cName;

  Object.assign(bookingTypeFormData, {
    id: activeId.value,
    name: currentBookingType.cName,
    accountNumberId: currentBookingType.cAccountNumberID
  });
};

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("UPDATE_BOOKING_TYPE: onClickOk");

  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.updateBookingType.messages.dbNotConnected"
    ),
    handleUserNotice,
    errorContext: "UPDATE_BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (!bookingTypeFormData.id) {
        await handleUserNotice("UpdateBookingType", "no id");
        return;
      }

      if (
        records.bookingTypes.isDuplicate(
          bookingTypeFormData.name,
          bookingTypeFormData.id as number
        )
      ) {
        await handleUserNotice("UpdateBookingType", "duplicate");
        return;
      }

      const bookingType = mapBookingTypeFormToDb(
        activeAccountId
      ) as BookingTypeDb;

      records.bookingTypes.update(bookingType);
      await update(bookingType);
      runtime.resetTeleport();
      await handleUserNotice("UpdateBookingType", "success");
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.updateBookingType.title")
});

onBeforeMount(() => {
  DomainUtils.log("UPDATE_BOOKING_TYPE: onBeforeMount");
  loadCurrentBookingType();
});

DomainUtils.log("COMPONENTS DIALGOS UpdateBookingType: setup");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <BookingTypeForm :mode="'update'" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
