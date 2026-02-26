<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";
import {useBookingsDB} from "@/composables/useIndexedDB";
import {useBookingForm} from "@/composables/useForms";
import {useDialogGuards} from "@/composables/useDialogGuards";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {DATE} from "@/domains/configs/date";
import {INDEXED_DB} from "@/configs/database";
import {databaseService} from "@/services/database/service";
import {useBrowser} from "@/composables/useBrowser";
import {useAlert} from "@/composables/useAlert";

const {t} = useI18n();
const {add} = useBookingsDB();
const {mapBookingFormToDb, reset} = useBookingForm();
const {submitGuard} = useDialogGuards();
const {getMessage} = useBrowser();
const {handleUserInfo} = useAlert();
const records = useRecordsStore();
const {activeAccountId} = useSettingsStore();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS AddBooking: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification: handleUserInfo,
    errorContext: "ADD_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);
      const addBookingID = await add(bookingData);

      if (addBookingID === INDEXED_DB.INVALID_ID) {
        throw new Error(t("components.dialogs.addBooking.messages.error"));
      }

      records.bookings.add({...bookingData, cID: addBookingID}, true);
      await handleUserInfo(t("components.dialogs.addBooking.title"), t("components.dialogs.addBooking.messages.success"));
      reset();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addBooking.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS AddBooking: onBeforeMount");
  reset();
});

DomainUtils.log("COMPONENTS DIALOGS AddBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingForm/>
  </BaseDialogForm>
</template>
