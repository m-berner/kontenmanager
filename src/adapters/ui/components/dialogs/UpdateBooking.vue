<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateBookingUsecase} from "@/app/usecases/bookings";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import {DATE} from "@/domain/constants";
import type {BookingDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import BookingForm from "@/adapters/ui/components/dialogs/forms/BookingForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createBookingFormManager, provideBookingFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {activeAccountId} = storeToRefs(useSettingsStore());
const runtime = useRuntimeStore();
const bookingForm = createBookingFormManager();
provideBookingFormManager(bookingForm);
const {bookingFormData, mapBookingFormToDb, reset: resetForm} = bookingForm;
const records = useRecordsStore();
const {submitGuard, isLoading} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentBooking = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateBooking: loadCurrentBooking");
  resetForm();
  const currentBooking = records.bookings.getById(runtime.activeId);

  // Bail out instead of populating the form from a missing record. Every field
  // below would become `undefined`, including `id` — and mapBookingFormToDb's
  // `data.id > 0` gate would then be false, so it returns an object with NO
  // cID. baseRepository.save() reads that as an insert and `store.add()`s a
  // duplicate booking, while records.bookings.update() silently no-ops on the
  // missing index. A failed lookup must not be able to turn an update into an
  // insert.
  if (!currentBooking) {
    await alertAdapter.feedbackError(
        t("components.dialogs.updateBooking.title"),
        browserAdapter.getMessage("xx_missing_record"),
        {data: {activeId: runtime.activeId}}
    );
    runtime.resetTeleport();
    return;
  }

  bookingFormData.selected = currentBooking.cBookingTypeID || -1;

  Object.assign(bookingFormData, {
    id: currentBooking.cID,
    bookDate: currentBooking.cBookDate,
    debit: currentBooking.cDebit,
    credit: currentBooking.cCredit,
    description: currentBooking.cDescription,
    exDate: currentBooking.cExDate,
    count: currentBooking.cCount,
    stockId: currentBooking.cStockID,
    sourceTaxCredit: currentBooking.cSourceTaxCredit,
    sourceTaxDebit: currentBooking.cSourceTaxDebit,
    transactionTaxCredit: currentBooking.cTransactionTaxCredit,
    transactionTaxDebit: currentBooking.cTransactionTaxDebit,
    taxCredit: currentBooking.cTaxCredit,
    taxDebit: currentBooking.cTaxDebit,
    feeCredit: currentBooking.cFeeCredit,
    feeDebit: currentBooking.cFeeDebit,
    soliCredit: currentBooking.cSoliCredit,
    soliDebit: currentBooking.cSoliDebit,
    marketPlace: currentBooking.cMarketPlace
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
          activeAccountId.value,
          DATE.ISO,
          records.bookingTypes.items
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

defineExpose({onClickOk, title: t("components.dialogs.updateBooking.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateBooking: onBeforeMount");
  void loadCurrentBooking();
});

log("COMPONENTS DIALOGS UpdateBooking: setup");
</script>

<template>
  <!--
    No `:isUpdate` binding here, unlike StockForm/AccountForm: BookingForm
    declares no props at all, so it was a fallthrough attribute rendered into
    the DOM as `isupdate="true"`. Its siblings need the flag to exclude the
    edited record from their own duplicate checks (ISIN/symbol, IBAN);
    bookings have no uniqueness constraint and no update-mode behaviour, so
    there is nothing for it to drive.
  -->
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <BookingForm/>
  </BaseDialogForm>
</template>
