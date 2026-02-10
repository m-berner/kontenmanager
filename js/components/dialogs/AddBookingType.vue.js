import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { DomainUtils } from "@/domains/utils";
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
const { bookingTypeFormData, mapBookingTypeFormToDb, reset } = useBookingTypeForm();
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref(null);
const onClickOk = async () => {
    DomainUtils.log("ADD_BOOKING_TYPE: onClickOk");
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: t("components.dialogs.addBookingType.messages.dbNotConnected"),
        handleUserNotice,
        errorContext: "BOOKING_TYPE",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            if (records.bookingTypes.isDuplicate(bookingTypeFormData.name)) {
                await handleUserNotice("AddBookingType", "duplicate");
                return;
            }
            const bookingTypeData = mapBookingTypeFormToDb(activeAccountId);
            const addBookingTypeID = await add(bookingTypeData);
            if (addBookingTypeID === INDEXED_DB.INVALID_ID) {
                DomainUtils.log("ADD_BOOKING_TYPE: Failed to create booking type");
                await handleUserNotice("AddBookingType", "add failed");
                return;
            }
            records.bookingTypes.add({ ...bookingTypeData, cID: addBookingTypeID });
            reset();
            await handleUserNotice("AddBookingType", "success");
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.addBookingType.title")
};
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("ADD_BOOKING_TYPE: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddBookingType: setup");
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
const __VLS_6 = __VLS_asFunctionalComponent(BookingTypeForm, new BookingTypeForm({
    mode: ('add'),
}));
const __VLS_7 = __VLS_6({
    mode: ('add'),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_2;
var __VLS_4 = __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BookingTypeForm: BookingTypeForm,
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
