<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateBookingTypeUsecase} from "@/app/usecases/bookingTypes";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import type {BookingTypeDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import BookingTypeForm from "@/adapters/primary/components/dialogs/forms/BookingTypeForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createBookingTypeFormManager, provideBookingTypeFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const bookingTypeForm = createBookingTypeFormManager();
provideBookingTypeFormManager(bookingTypeForm);
const {bookingTypeFormData, mapBookingTypeFormToDb, reset: resetForm} = bookingTypeForm;
const {submitGuard} = useDialogGuards(t);
const {activeAccountId} = useSettingsStore();
const {databaseService, browserService, alertService, repositories} = useServices();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);
const bookingTypeRef = ref<typeof BookingTypeForm | null>(null);

const loadCurrentBookingType = (): void => {
  log("COMPONENTS DIALOGS UpdateBookingType: loadCurrentBookingType");
  resetForm();
  const currentBookingType = records.bookingTypes.getById(runtime.activeId);
  if (!currentBookingType) return;

  bookingTypeFormData.id = runtime.activeId;
  bookingTypeFormData.name = currentBookingType.cName;

  Object.assign(bookingTypeFormData, {
    id: runtime.activeId,
    name: currentBookingType.cName,
    accountNumberId: currentBookingType.cAccountNumberID
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateBookingType: onClickOk");

  // Check if a booking type is selected for editing
  if (!bookingTypeRef.value?.edit) {
    await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noSelection"));
    return;
  }

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "UPDATE_BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (!bookingTypeFormData.id) {
        await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noId"));
        return;
      }

      const bookingType = mapBookingTypeFormToDb(
          activeAccountId
      ) as BookingTypeDb;
      const res = await updateBookingTypeUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {
            bookingType,
            isDuplicateName: (name, id) => records.bookingTypes.isDuplicate(name, id)
          }
      );

      if (res.status === "duplicate") {
        await alertService.feedbackInfo(
            t("components.dialogs.updateBookingType.title"),
            t("components.dialogs.updateBookingType.messages.duplicate")
        );
        return;
      }

      await alertService.feedbackInfo(
          t("components.dialogs.updateBookingType.title"),
          t("components.dialogs.updateBookingType.messages.success")
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.updateBookingType.title")
});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateBookingType: onBeforeMount");
  loadCurrentBookingType();
});

log("COMPONENTS DIALOGS UpdateBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingTypeForm ref="bookingTypeRef" :mode="'update'"/>
  </BaseDialogForm>
</template>
