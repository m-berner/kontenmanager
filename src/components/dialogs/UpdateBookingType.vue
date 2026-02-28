<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import type {BookingTypeDb} from "@/types";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import {useBookingTypesDB} from "@/composables/useIndexedDB";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {useBookingTypeForm} from "@/composables/useForms";
import {useSettingsStore} from "@/stores/settings";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {getMessage} = useBrowser();
const {update} = useBookingTypesDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {activeId} = storeToRefs(runtime);
const {
  bookingTypeFormData,
  mapBookingTypeFormToDb,
  reset: resetForm
} = useBookingTypeForm();
const {submitGuard} = useDialogGuards(t);
const {activeAccountId} = useSettingsStore();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);
const bookingTypeRef = ref<typeof BookingTypeForm | null>(null);

const loadCurrentBookingType = (): void => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateBookingType: loadCurrentBookingType");
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
  DomainUtils.log("COMPONENTS DIALOGS UpdateBookingType: onClickOk");

  // Check if a booking type is selected for editing
  if (!bookingTypeRef.value?.edit) {
    await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noSelection"));
    return;
  }

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "UPDATE_BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (!bookingTypeFormData.id) {
        await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noId"));
        return;
      }

      if (
          records.bookingTypes.isDuplicate(
              bookingTypeFormData.name,
              bookingTypeFormData.id as number
          )
      ) {
        await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.duplicate"));
        return;
      }

      const bookingType = mapBookingTypeFormToDb(
          activeAccountId
      ) as BookingTypeDb;

      records.bookingTypes.update(bookingType);
      await update(bookingType);
      runtime.resetTeleport();
      await alertService.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.success"));
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.updateBookingType.title")
});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateBookingType: onBeforeMount");
  loadCurrentBookingType();
});

DomainUtils.log("COMPONENTS DIALOGS UpdateBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingTypeForm ref="bookingTypeRef" :mode="'update'"/>
  </BaseDialogForm>
</template>
