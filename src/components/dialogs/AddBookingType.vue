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
import { DomainUtils } from "@/domains/utils";
//import { useAlert } from "@/composables/useAlert";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { useBookingTypeForm } from "@/composables/useForms";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { useSettingsStore } from "@/stores/settings";
import { INDEXED_DB } from "@/config/database";
import { useBrowser } from "@/composables/useBrowser";

const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { add } = useBookingTypesDB();
const records = useRecordsStore();
const { activeAccountId } = useSettingsStore();
const { bookingTypeFormData, mapBookingTypeFormToDb, reset } =
  useBookingTypeForm();
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("ADD_BOOKING_TYPE: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.addBookingType.messages.dbNotConnected"
    ),
    handleUserNotice,
    errorContext: "BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (records.bookingTypes.isDuplicate(bookingTypeFormData.name)) {
        await handleUserNotice(
          "AddBookingType",
          "duplicate"
        );
        return;
      }
      const bookingTypeData = mapBookingTypeFormToDb(activeAccountId);
      const addBookingTypeID = await add(bookingTypeData);
      if (addBookingTypeID === INDEXED_DB.INVALID_ID) {
        DomainUtils.log("ADD_BOOKING_TYPE: Failed to create booking type");
        await handleUserNotice(
          "AddBookingType",
          "add failed"
        );
        return;
      }

      records.bookingTypes.add({ ...bookingTypeData, cID: addBookingTypeID });
      reset();
      await handleUserNotice(
        "AddBookingType",
        "success"
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.addBookingType.title")
});

onBeforeMount(() => {
  DomainUtils.log("ADD_BOOKING_TYPE: onBeforeMount");
  reset();
});

DomainUtils.log("COMPONENTS DIALOGS AddBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingTypeForm :mode="'add'" />
  </BaseDialogForm>
</template>
