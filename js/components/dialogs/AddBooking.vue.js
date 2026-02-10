import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useBookingsDB } from "@/composables/useIndexedDB";
import { useBookingForm } from "@/composables/useForms";
import { useDialogSubmit } from "@/composables/useDialogSubmit";
import BookingForm from "@/components/dialogs/forms/BookingForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { DATE } from "@/domains/config/date";
import { INDEXED_DB } from "@/config/database";
const { t } = useI18n();
const { add } = useBookingsDB();
const { mapBookingFormToDb, reset } = useBookingForm();
const { createAddHandler } = useDialogSubmit();
const records = useRecordsStore();
const { activeAccountId } = useSettingsStore();
const baseDialogRef = ref(null);
const onClickOk = createAddHandler({
    dialogRef: baseDialogRef,
    componentName: "AddBooking",
    i18nPrefix: "components.dialogs.addBooking",
    reset,
    operation: async () => {
        const bookingData = mapBookingFormToDb(activeAccountId, DATE.ISO);
        const addBookingID = await add(bookingData);
        if (addBookingID === INDEXED_DB.INVALID_ID) {
            throw new Error(t("components.dialogs.addBooking.messages.error"));
        }
        records.bookings.add({ ...bookingData, cID: addBookingID }, true);
    }
});
const __VLS_exposed = { onClickOk, title: t("components.dialogs.addBooking.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("ADD_BOOKING: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddBooking: setup");
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
const __VLS_6 = __VLS_asFunctionalComponent(BookingForm, new BookingForm({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
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
