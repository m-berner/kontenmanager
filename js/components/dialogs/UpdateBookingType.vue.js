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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VForm;
;
VForm;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
;
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
[formRef,];
;
const __VLS_10 = __VLS_asFunctionalComponent(BookingTypeForm, new BookingTypeForm({
    mode: ('update'),
}));
const __VLS_11 = __VLS_10({
    mode: ('update'),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const __VLS_14 = {}.VOverlay;
;
VOverlay;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_16 = __VLS_15({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_18 } = __VLS_17.slots;
[isLoading,];
const __VLS_19 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_21 = __VLS_20({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
var __VLS_17;
var __VLS_3;
;
;
var __VLS_8 = __VLS_7;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BookingTypeForm: BookingTypeForm,
            isLoading: isLoading,
            formRef: formRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
