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
import {log} from "@/domains/utils/utils";
import {useBookingForm} from "@/composables/useForms";
import {useDialogGuards} from "@/composables/useDialogGuards";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {DATE, ERROR_CATEGORY, INDEXED_DB} from "@/constants";
import {databaseService} from "@/services/database/service";
import {browserService} from "@/services/browserService";
import {alertService} from "@/services/alert";
import {bookingsRepository} from "@/services/database/repositories";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";

const {t} = useI18n();
const {mapBookingFormToDb, reset} = useBookingForm();
const {submitGuard} = useDialogGuards(t);
const records = useRecordsStore();
const {activeAccountId} = useSettingsStore();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddBooking: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "ADD_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);
      const addBookingID = await bookingsRepository.save(bookingData);

      if (addBookingID === INDEXED_DB.INVALID_ID) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {entity: "booking"}
        );
      }

      records.bookings.add({...bookingData, cID: addBookingID}, true);
      await alertService.feedbackInfo(t("components.dialogs.addBooking.title"), t("components.dialogs.addBooking.messages.success"));
      reset();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addBooking.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddBooking: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingForm/>
  </BaseDialogForm>
</template>
