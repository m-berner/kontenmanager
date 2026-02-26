<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import type {BookingDb} from "@/types";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";
import {useBookingsDB} from "@/composables/useIndexedDB";
import {useBrowser} from "@/composables/useBrowser";
import {useBookingForm} from "@/composables/useForms";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {DATE} from "@/domains/configs/date";
import {databaseService} from "@/services/database/service";
import {useAlert} from "@/composables/useAlert";

const {t} = useI18n();
const {getMessage} = useBrowser();
const {handleUserInfo} = useAlert();
const {update} = useBookingsDB();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const {activeId} = storeToRefs(runtime);
const {
  bookingFormData,
  mapBookingFormToDb,
  reset: resetForm
} = useBookingForm();
const records = useRecordsStore();
const {submitGuard} = useDialogGuards();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentBooking = (): void => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateBooking: loadCurrentBooking");
  resetForm();
  const currentBooking = records.bookings.getById(activeId.value);

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
  DomainUtils.log("COMPONENTS DIALOGS UpdateBooking: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification: handleUserInfo,
    errorContext: "UPDATE_BOOKING",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const booking = mapBookingFormToDb(
          activeAccountId,
          DATE.ISO
      ) as BookingDb;
      records.bookings.update(booking);
      await update(booking);
      runtime.resetTeleport();
      await handleUserInfo(t("components.dialogs.updateBooking.title"), getMessage("xx_db_update_success"));
      runtime.resetOptionsMenuColors();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateBooking.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateBooking: onBeforeMount");
  loadCurrentBooking();
});

DomainUtils.log("COMPONENTS DIALOGS UpdateBooking: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <BookingForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
