import { onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import { useBookingTypeForm } from "@/composables/useForms";
const { bookingTypeFormData, reset } = useBookingTypeForm();
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { remove } = useBookingTypesDB();
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const canDeleteBookingType = (bookingTypeId) => {
    return !records.bookings.hasBookingType(bookingTypeId);
};
const onClickOk = async () => {
    DomainUtils.log("DELETE_BOOKING_TYPE : onClickOk");
    if (!(await ensureConnected(databaseService.isConnected(), handleUserNotice, t("components.dialogs.deleteBookingType.messages.dbNotConnected"))))
        return;
    if (!bookingTypeFormData.id) {
        DomainUtils.log("DELETE_BOOKING_TYPE: No booking type selected");
        return;
    }
    await withLoading(async () => {
        try {
            if (!canDeleteBookingType(bookingTypeFormData.id)) {
                await handleUserNotice("DeleteBookingType", "not deletable");
                return;
            }
            records.bookingTypes.remove(bookingTypeFormData.id);
            await remove(bookingTypeFormData.id);
            runtime.resetTeleport();
            await handleUserNotice("DeleteBookingType", "success");
        }
        catch {
            throw new AppError(ERROR_CODES.DELETE_BOOKING_TYPE, ERROR_CATEGORY.VALIDATION, true);
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.deleteBookingType.title")
};
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("DELETE_BOOKING_TYPE: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: setup");
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
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
;
const __VLS_9 = __VLS_asFunctionalComponent(BookingTypeForm, new BookingTypeForm({
    mode: ('delete'),
}));
const __VLS_10 = __VLS_9({
    mode: ('delete'),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_13 = {}.VOverlay;
;
VOverlay;
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_15 = __VLS_14({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_17 } = __VLS_16.slots;
[isLoading,];
const __VLS_18 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_20 = __VLS_19({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
var __VLS_16;
var __VLS_3;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BookingTypeForm: BookingTypeForm,
            isLoading: isLoading,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
