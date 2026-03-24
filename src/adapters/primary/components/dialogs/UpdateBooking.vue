<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateBookingUsecase} from "@/app/usecases/bookings";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {DATE} from "@/domain/constants";
import type {BookingDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import BookingForm from "@/adapters/primary/components/dialogs/forms/BookingForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createBookingFormManager, provideBookingFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const bookingForm = createBookingFormManager();
provideBookingFormManager(bookingForm);
const {bookingFormData, mapBookingFormToDb, reset: resetForm} = bookingForm;
const records = useRecordsStore();
const {submitGuard} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentBooking = (): void => {
  log("COMPONENTS DIALOGS UpdateBooking: loadCurrentBooking");
  resetForm();
  const currentBooking = records.bookings.getById(runtime.activeId);

  bookingFormData.selected = currentBooking?.cBookingTypeID || -1;

  Object.assign(bookingFormData, {
    id: currentBooking?.cID,
    bookingTypeId: currentBooking?.cBookingTypeID,
    bookDate: currentBooking?.cBookDate,
    debit: currentBooking?.cDebit,
    credit: currentBooking?.cCredit,
    description: currentBooking?.cDescription,
    exDate: currentBooking?.cExDate,
    count: currentBooking?.cCount,
    accountTypeId: currentBooking?.cAccountNumberID,
    stockId: currentBooking?.cStockID,
    sourceTaxCredit: currentBooking?.cSourceTaxCredit,
    sourceTaxDebit: currentBooking?.cSourceTaxDebit,
    transactionTaxCredit: currentBooking?.cTransactionTaxCredit,
    transactionTaxDebit: currentBooking?.cTransactionTaxDebit,
    taxCredit: currentBooking?.cTaxCredit,
    taxDebit: currentBooking?.cTaxDebit,
    feeCredit: currentBooking?.cFeeCredit,
    feeDebit: currentBooking?.cFeeDebit,
    soliCredit: currentBooking?.cSoliCredit,
    soliDebit: currentBooking?.cSoliDebit,
    marketPlace: currentBooking?.cMarketPlace
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateBooking: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const booking = mapBookingFormToDb(
          activeAccountId,
          DATE.ISO
      ) as BookingDb;

      await updateBookingUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {booking}
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.updateBooking.title"),
          t("components.dialogs.updateBooking.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateBooking.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateBooking: onBeforeMount");
  loadCurrentBooking();
});

log("COMPONENTS DIALOGS UpdateBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
