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
  // Deliberately does NOT pre-populate from runtime.activeId: that ref is a
  // generic "last booking/stock row acted on" id, written unconditionally by
  // useMenu.ts's executeAction() for DotMenu row actions. This dialog is only
  // ever reachable via HeaderBar.vue's icon (useHeaderBarActions.ts), which
  // never sets activeId - so it could hold a stale booking/stock id from a
  // completely different IndexedDB store, which happens to collide with a
  // real (but unrelated) booking type's own auto-increment id. Pre-selecting
  // from it silently let a user rename/re-role the wrong booking type with no
  // visible sign anything was wrong. The dropdown below always requires an
  // explicit user selection instead.
  resetForm();
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateBookingType: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      // Moved inside submitGuard, following DeleteBookingType's fix: as a
      // pre-check this sat outside the isLoading reentrancy guard, and reading
      // it here picks up a selection made between the click and the operation
      // running. The `id` check below already ran inside; the selection check
      // did not.
      if (!bookingTypeRef.value?.edit) {
        await alertAdapter.feedbackInfo(t("components.dialogs.updateBookingType.title"), t("components.dialogs.updateBookingType.messages.noSelection"));
        return;
      }

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

      if (res.status === "roleConflict") {
        await alertAdapter.feedbackInfo(
            t("components.dialogs.updateBookingType.title"),
            t("components.dialogs.updateBookingType.messages.roleConflict")
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
