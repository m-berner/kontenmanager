<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateBookingTypeUsecase} from "@/app/usecases/bookingTypes";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import type {BookingTypeDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import BookingTypeForm from "@/adapters/ui/components/dialogs/forms/BookingTypeForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createBookingTypeFormManager, provideBookingTypeFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const bookingTypeForm = createBookingTypeFormManager();
provideBookingTypeFormManager(bookingTypeForm);
const {bookingTypeFormData, mapBookingTypeFormToDb, reset: resetForm} = bookingTypeForm;
const {submitGuard, isLoading} = useDialogGuards(t);
const {activeAccountId} = storeToRefs(useSettingsStore());
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
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
    await alertAdapter.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noSelection"));
    return;
  }

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (!bookingTypeFormData.id) {
        await alertAdapter.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noId"));
        return;
      }

      const bookingType = mapBookingTypeFormToDb(
          activeAccountId.value
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
        await alertAdapter.feedbackInfo(
            t("components.dialogs.updateBookingType.title"),
            t("components.dialogs.updateBookingType.messages.duplicate")
        );
        return;
      }

      await alertAdapter.feedbackInfo(
          t("components.dialogs.updateBookingType.title"),
          t("components.dialogs.updateBookingType.messages.success")
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.updateBookingType.title"),
  isLoading: () => isLoading.value
});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateBookingType: onBeforeMount");
  loadCurrentBookingType();
});

log("COMPONENTS DIALOGS UpdateBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <BookingTypeForm ref="bookingTypeRef" :mode="'update'"/>
  </BaseDialogForm>
</template>
