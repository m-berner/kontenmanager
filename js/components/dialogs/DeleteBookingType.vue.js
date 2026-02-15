import { onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useBookingTypesDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database/service";
import BookingTypeForm from "@/components/dialogs/forms/BookingTypeForm.vue";
import { useBookingTypeForm } from "@/composables/useForms";
import { useAlert } from "@/composables/useAlert";
const { bookingTypeFormData, reset } = useBookingTypeForm();
const { t } = useI18n();
const { getMessage, showSystemNotification } = useBrowser();
const { handleUserError } = useAlert();
const { remove } = useBookingTypesDB();
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const canDeleteBookingType = (bookingTypeId) => {
    return !records.bookings.hasBookingType(bookingTypeId);
};
const onClickOk = async () => {
    DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: onClickOk");
    if (!(await ensureConnected(databaseService.isConnected(), showSystemNotification, t("components.dialogs.deleteBookingType.messages.dbNotConnected"))))
        return;
    if (!bookingTypeFormData.id) {
        DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: No booking type selected");
        return;
    }
    await withLoading(async () => {
        try {
            if (!canDeleteBookingType(bookingTypeFormData.id)) {
                await showSystemNotification("DeleteBookingType", getMessage("xx_db_no_delete"));
                return;
            }
            records.bookingTypes.remove(bookingTypeFormData.id);
            await remove(bookingTypeFormData.id);
            runtime.resetTeleport();
            await showSystemNotification("DeleteBookingType", getMessage("xx_db_delete_success"));
        }
        catch (err) {
            await handleUserError("DeleteBookingType", err, {});
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.deleteBookingType.title")
};
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS DeleteBookingType: setup");
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
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
const __VLS_9 = BookingTypeForm;
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    mode: ('delete'),
}));
const __VLS_11 = __VLS_10({
    mode: ('delete'),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_14;
vOverlay;
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_16 = __VLS_15({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
;
;
const { default: __VLS_19 } = __VLS_17.slots;
let __VLS_20;
vProgressCircular;
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_22 = __VLS_21({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
[isLoading,];
var __VLS_17;
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
