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
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { update } = useBookingTypesDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const { activeId } = storeToRefs(runtime);
const { bookingTypeFormData, mapBookingTypeFormToDb, reset: resetForm } = useBookingTypeForm();
const { isLoading, submitGuard } = useDialogGuards();
const { activeAccountId } = useSettingsStore();
const formRef = ref(null);
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
    await submitGuard({
        formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: t("components.dialogs.updateBookingType.messages.dbNotConnected"),
        handleUserNotice,
        errorContext: "UPDATE_BOOKING_TYPE",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            if (!bookingTypeFormData.id) {
                await handleUserNotice("UpdateBookingType", "no id");
                return;
            }
            if (records.bookingTypes.isDuplicate(bookingTypeFormData.name, bookingTypeFormData.id)) {
                await handleUserNotice("UpdateBookingType", "duplicate");
                return;
            }
            const bookingType = mapBookingTypeFormToDb(activeAccountId);
            records.bookingTypes.update(bookingType);
            await update(bookingType);
            runtime.resetTeleport();
            await handleUserNotice("UpdateBookingType", "success");
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
DomainUtils.log("COMPONENTS DIALGOS UpdateBookingType: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
const __VLS_10 = BookingTypeForm;
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    mode: ('update'),
}));
const __VLS_12 = __VLS_11({
    mode: ('update'),
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_15;
vOverlay;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_17 = __VLS_16({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
;
;
const { default: __VLS_20 } = __VLS_18.slots;
let __VLS_21;
vProgressCircular;
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_23 = __VLS_22({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
[isLoading,];
var __VLS_18;
[];
var __VLS_3;
var __VLS_4;
var __VLS_8 = __VLS_7;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
