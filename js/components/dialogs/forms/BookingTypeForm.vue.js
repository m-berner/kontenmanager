import { nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useBookingTypeForm } from "@/composables/useForms";
import { validationService } from "@/services/validation";
import { INDEXED_DB } from "@/configs/database";
import { DomainUtils } from "@/domains/utils";
const props = defineProps();
const { t } = useI18n();
const records = useRecordsStore();
const { bookingTypeFormData } = useBookingTypeForm();
const NAME_RULES = [
    t("validators.nameRules.required"),
    t("validators.nameRules.length"),
    t("validators.nameRules.begin")
];
const edit = ref(false);
const nameInput = ref(null);
const onSelect = (id) => {
    if (!id)
        return;
    const item = records.bookingTypes.getById(id);
    if (item) {
        edit.value = true;
        bookingTypeFormData.id = item.cID;
        bookingTypeFormData.name = item.cName;
        nextTick(() => {
            nameInput.value?.focus();
        });
    }
};
const onClear = () => {
    edit.value = false;
};
const __VLS_exposed = {
    edit
};
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS FORMS BookingTypeForm: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (props.mode !== 'add') {
    let __VLS_0;
    vSelect;
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick:clear': {} },
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.bookingTypeFormData.id),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
        items: (__VLS_ctx.records.bookingTypes.items),
        label: (__VLS_ctx.t('components.dialogs.updateBookingType.bookingTypeLabel')),
        menuProps: ({ maxHeight: '200px' }),
        ...{ class: "mb-4" },
        clearable: true,
        density: "compact",
        variant: "outlined",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick:clear': {} },
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.bookingTypeFormData.id),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
        items: (__VLS_ctx.records.bookingTypes.items),
        label: (__VLS_ctx.t('components.dialogs.updateBookingType.bookingTypeLabel')),
        menuProps: ({ maxHeight: '200px' }),
        ...{ class: "mb-4" },
        clearable: true,
        density: "compact",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ 'click:clear': {} },
        { 'onClick:clear': (__VLS_ctx.onClear) });
    const __VLS_7 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onSelect) });
    ;
    var __VLS_3;
    var __VLS_4;
}
if ((__VLS_ctx.edit && props.mode !== 'delete') || props.mode === 'add') {
    let __VLS_8;
    vTextField;
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
        ref: "nameInput",
        modelValue: (__VLS_ctx.bookingTypeFormData.name),
        autofocus: (props.mode === 'add'),
        counter: (32),
        label: (__VLS_ctx.t(`components.dialogs.${props.mode}BookingType.title`)),
        placeholder: (__VLS_ctx.t('components.dialogs.addBookingType.placeholder')),
        rules: (__VLS_ctx.validationService.nameRules(__VLS_ctx.NAME_RULES)),
        density: "compact",
        variant: "outlined",
    }));
    const __VLS_10 = __VLS_9({
        ref: "nameInput",
        modelValue: (__VLS_ctx.bookingTypeFormData.name),
        autofocus: (props.mode === 'add'),
        counter: (32),
        label: (__VLS_ctx.t(`components.dialogs.${props.mode}BookingType.title`)),
        placeholder: (__VLS_ctx.t('components.dialogs.addBookingType.placeholder')),
        rules: (__VLS_ctx.validationService.nameRules(__VLS_ctx.NAME_RULES)),
        density: "compact",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    var __VLS_13 = {};
    var __VLS_11;
}
var __VLS_14 = __VLS_13;
[bookingTypeFormData, bookingTypeFormData, INDEXED_DB, INDEXED_DB, records, t, t, t, onClear, onSelect, edit, validationService, NAME_RULES,];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
    __typeProps: {},
});
export default {};
