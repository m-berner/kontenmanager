import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useBookingsDB } from "@/composables/useIndexedDB";
import { useBookingForm } from "@/composables/useForms";
import { useDialogGuards } from "@/composables/useDialogGuards";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { DATE } from "@/domains/configs/date";
import { INDEXED_DB } from "@/configs/database";
import { databaseService } from "@/services/database/service";
import { useBrowser } from "@/composables/useBrowser";
const { t } = useI18n();
const { add } = useBookingsDB();
const { mapBookingFormToDb, reset } = useBookingForm();
const { submitGuard } = useDialogGuards();
const { getMessage, handleUserNotice } = useBrowser();
const records = useRecordsStore();
const { activeAccountId } = useSettingsStore();
const baseDialogRef = ref(null);
const onClickOk = async () => {
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        handleUserNotice,
        errorContext: "ADD_BOOKING",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);
            const addBookingID = await add(bookingData);
            if (addBookingID === INDEXED_DB.INVALID_ID) {
                throw new Error(t("components.dialogs.addBooking.messages.error"));
            }
            records.bookings.add({ ...bookingData, cID: addBookingID }, true);
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.addBooking.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("COMPONENTS DIALOGS AddBooking: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddBooking: setup");
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
const __VLS_0 = BaseDialogForm || BaseDialogForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ref: "baseDialogRef",
}));
const __VLS_2 = __VLS_1({
    ref: "baseDialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_7 } = __VLS_3.slots;
const __VLS_8 = BookingForm;
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_3;
var __VLS_6 = __VLS_5;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
