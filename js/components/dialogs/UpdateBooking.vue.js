import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useBookingsDB } from "@/composables/useIndexedDB";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingForm } from "@/composables/useForms";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { DATE } from "@/domains/config/date";
import { databaseService } from "@/services/database";
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { update } = useBookingsDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const { activeId } = storeToRefs(runtime);
const { bookingFormData, mapBookingFormToDb, reset: resetForm } = useBookingForm();
const records = useRecordsStore();
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref(null);
const loadCurrentBooking = () => {
    DomainUtils.log("UPDATE_BOOKING: loadCurrentBooking");
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
const onClickOk = async () => {
    DomainUtils.log("UPDATE_BOOKING : onClickOk");
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: t("components.dialogs.updateBooking.messages.dbNotConnected"),
        handleUserNotice,
        errorContext: "UPDATE_BOOKING",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const booking = mapBookingFormToDb(activeAccountId, DATE.ISO);
            records.bookings.update(booking);
            await update(booking);
            runtime.resetTeleport();
            await handleUserNotice("UpdateBooking", "success");
            runtime.resetOptionsMenuColors();
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.updateBooking.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("UPDATE_BOOKING: onBeforeMount");
    loadCurrentBooking();
});
DomainUtils.log("COMPONENTS DIALOGS UpdateBooking: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
;
const __VLS_0 = __VLS_asFunctionalComponent(BaseDialogForm, new BaseDialogForm({
    ref: "baseDialogRef",
}));
const __VLS_1 = __VLS_0({
    ref: "baseDialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
;
var __VLS_3 = {};
const { default: __VLS_5 } = __VLS_2.slots;
[baseDialogRef,];
;
const __VLS_6 = __VLS_asFunctionalComponent(BookingForm, new BookingForm({
    isUpdate: (true),
}));
const __VLS_7 = __VLS_6({
    isUpdate: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_2;
var __VLS_4 = __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BookingForm: BookingForm,
            BaseDialogForm: BaseDialogForm,
            baseDialogRef: baseDialogRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
