import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { useBookingTypeForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { update } = useBookingTypesDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const { activeId } = storeToRefs(runtime);
const { bookingTypeFormData, mapBookingTypeFormToDb, reset: resetForm } = useBookingTypeForm();
const { submitGuard } = useDialogGuards();
const { activeAccountId } = useSettingsStore();
const baseDialogRef = ref(null);
const bookingTypeRef = ref(null);
const loadCurrentBookingType = () => {
    DomainUtils.log("UPDATE_BOOKING_TYPE: loadCurrentBookingType");
    resetForm();
    const currentBookingType = records.bookingTypes.getById(activeId.value);
    if (!currentBookingType)
        return;
    bookingTypeFormData.id = activeId.value;
    bookingTypeFormData.name = currentBookingType.cName;
    Object.assign(bookingTypeFormData, {
        id: activeId.value,
        name: currentBookingType.cName,
        accountNumberId: currentBookingType.cAccountNumberID
    });
};
const onClickOk = async () => {
    DomainUtils.log("UPDATE_BOOKING_TYPE: onClickOk");
    if (!bookingTypeRef.value?.edit) {
        await handleUserNotice("UpdateBookingType", getMessage("xx_db_no_selected"));
        return;
    }
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        handleUserNotice,
        errorContext: "UPDATE_BOOKING_TYPE",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            if (!bookingTypeFormData.id) {
                await handleUserNotice("UpdateBookingType", getMessage("xx_db_missing_id"));
                return;
            }
            if (records.bookingTypes.isDuplicate(bookingTypeFormData.name, bookingTypeFormData.id)) {
                await handleUserNotice("UpdateBookingType", getMessage("xx_db_duplicate"));
                return;
            }
            const bookingType = mapBookingTypeFormToDb(activeAccountId);
            records.bookingTypes.update(bookingType);
            await update(bookingType);
            runtime.resetTeleport();
            await handleUserNotice("UpdateBookingType", getMessage("xx_db_update_success"));
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.updateBookingType.title")
};
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("UPDATE_BOOKING_TYPE: onBeforeMount");
    loadCurrentBookingType();
});
DomainUtils.log("COMPONENTS DIALOGS UpdateBookingType: setup");
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
    ref: "bookingTypeRef",
    mode: ('update'),
}));
const __VLS_10 = __VLS_9({
    ref: "bookingTypeRef",
    mode: ('update'),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_13 = {};
var __VLS_11;
var __VLS_3;
var __VLS_6 = __VLS_5, __VLS_14 = __VLS_13;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
