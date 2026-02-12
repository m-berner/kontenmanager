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
import { INDEXED_DB } from "@/configs/database";
import { useBrowser } from "@/composables/useBrowser";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
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
        connectionErrorMessage: getMessage("xx_db_connection_err"),
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
const __VLS_8 = BookingTypeForm;
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    mode: ('add'),
}));
const __VLS_10 = __VLS_9({
    mode: ('add'),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_3;
var __VLS_6 = __VLS_5;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
