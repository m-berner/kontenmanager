<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES
} from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import { useBookingTypeForm } from "@/composables/useForms";

const { bookingTypeFormData, reset } = useBookingTypeForm();
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { remove } = useBookingTypesDB();
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const records = useRecordsStore();
const runtime = useRuntimeStore();

const canDeleteBookingType = (bookingTypeId: number): boolean => {
  return !records.bookings.hasBookingType(bookingTypeId);
};

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: onClickOk");

  if (
    !(await ensureConnected(
      databaseService.isConnected(),
      handleUserNotice,
      t("components.dialogs.deleteBookingType.messages.dbNotConnected")
    ))
  )
    return;

  if (!bookingTypeFormData.id) {
    DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: No booking type selected");
    return;
  }

  await withLoading(async () => {
    try {
      if (!canDeleteBookingType(bookingTypeFormData.id!)) {
        await handleUserNotice("DeleteBookingType", getMessage("xx_db_no_delete"));
        return;
      }

      records.bookingTypes.remove(bookingTypeFormData.id!);
      await remove(bookingTypeFormData.id!);
      runtime.resetTeleport();
      await handleUserNotice("DeleteBookingType", getMessage("xx_db_delete_success"));
    } catch {
      throw new AppError(
        ERROR_CODES.DELETE_BOOKING_TYPE,
        ERROR_CATEGORY.VALIDATION,
        true
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteBookingType.title")
});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: onBeforeMount");
  reset();
});

DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <BookingTypeForm :mode="'delete'" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
