<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {DomainUtils} from "@/domains/utils";
import {useBookingTypesDB} from "@/composables/useIndexedDB";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {useBookingTypeForm} from "@/composables/useForms";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useSettingsStore} from "@/stores/settings";
import {INDEXED_DB} from "@/configs/database";
import {useBrowser} from "@/composables/useBrowser";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {getMessage, showSystemNotification} = useBrowser();
const {add} = useBookingTypesDB();
const records = useRecordsStore();
const {activeAccountId} = useSettingsStore();
const {bookingTypeFormData, mapBookingTypeFormToDb, reset} =
    useBookingTypeForm();
const {submitGuard} = useDialogGuards();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS AddBookingType: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification,
    errorContext: "BOOKING_TYPE",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      if (records.bookingTypes.isDuplicate(bookingTypeFormData.name)) {
        await alertService.handleUserInfo(t("components.dialogs.addBookingType.title"), t("components.dialogs.addBookingType.messages.duplicate"));
        return;
      }
      const bookingTypeData = mapBookingTypeFormToDb(activeAccountId);
      const addBookingTypeID = await add(bookingTypeData);

      if (addBookingTypeID === INDEXED_DB.INVALID_ID) {
        throw new Error(t("components.dialogs.addBookingType.messages.error"));
      }

      records.bookingTypes.add({...bookingTypeData, cID: addBookingTypeID});
      await alertService.handleUserInfo(t("components.dialogs.addBookingType.title"), t("components.dialogs.addBookingType.messages.success"));
      reset();
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.addBookingType.title")
});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS AddBookingType: onBeforeMount");
  reset();
});

DomainUtils.log("COMPONENTS DIALOGS AddBookingType: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingTypeForm :mode="'add'"/>
  </BaseDialogForm>
</template>
