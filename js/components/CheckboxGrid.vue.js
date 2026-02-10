import { computed, onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { STORES } from "@/config/stores";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { COMPONENTS } from "@/config/components";
const props = defineProps();
const { t } = useI18n();
const { getStorage, setStorage } = useStorage();
const { handleUserError } = useAlert();
const checked = ref([]);
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const config = computed(() => {
    if (props.type === COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES) {
        return {
            map: STORES.INDEXES,
            storageKey: BROWSER_STORAGE.INDEXES.key,
            labelPath: null
        };
    }
    return {
        map: STORES.MATERIALS,
        storageKey: BROWSER_STORAGE.MATERIALS.key,
        labelPath: "views.optionsIndex.materials"
    };
});
const boxes = computed(() => {
    const keys = Array.from(config.value.map.keys());
    const half = Math.ceil(keys.length / 2);
    return {
        A: keys.slice(0, half),
        B: keys.slice(half)
    };
});
const getLabel = (item) => {
    if (config.value.labelPath) {
        return t(`${config.value.labelPath}.${item}`);
    }
    return config.value.map.get(item) || item;
};
const setChecked = async () => {
    isSaving.value = true;
    error.value = null;
    try {
        await setStorage(config.value.storageKey, [...checked.value]);
    }
    catch (err) {
        await handleUserError("Components CheckboxGrid", err, {});
    }
    finally {
        isSaving.value = false;
    }
};
onBeforeMount(async () => {
    DomainUtils.log("CHECKBOX_GRID: onBeforeMount");
    isLoading.value = true;
    error.value = null;
    try {
        const storage = await getStorage([config.value.storageKey]);
        checked.value = storage[config.value.storageKey] || [];
    }
    catch (err) {
        await handleUserError("Components CheckboxGrid", err, {});
    }
    finally {
        isLoading.value = false;
    }
});
DomainUtils.log("COMPONENTS CheckboxGrid: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.isLoading) {
    [isLoading,];
    const __VLS_0 = {}.VCol;
    ;
    VCol;
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "text-center" },
        cols: "12",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "text-center" },
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_4 } = __VLS_3.slots;
    const __VLS_5 = {}.VProgressCircular;
    ;
    VProgressCircular;
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        color: "primary",
        indeterminate: true,
    }));
    const __VLS_7 = __VLS_6({
        color: "primary",
        indeterminate: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "mt-3" },
    });
    (__VLS_ctx.t("components.checkboxGrid.loading"));
    [t,];
    var __VLS_3;
}
if (__VLS_ctx.error && !__VLS_ctx.isLoading) {
    [isLoading, error,];
    const __VLS_10 = {}.VCol;
    ;
    VCol;
    const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
        cols: "12",
    }));
    const __VLS_12 = __VLS_11({
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    const { default: __VLS_14 } = __VLS_13.slots;
    const __VLS_15 = {}.VAlert;
    ;
    VAlert;
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        ...{ 'onClick:close': {} },
        dismissible: true,
        type: "error",
    }));
    const __VLS_17 = __VLS_16({
        ...{ 'onClick:close': {} },
        dismissible: true,
        type: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    let __VLS_19;
    let __VLS_20;
    const __VLS_21 = ({ 'click:close': {} },
        { 'onClick:close': (...[$event]) => {
                if (!(__VLS_ctx.error && !__VLS_ctx.isLoading))
                    return;
                __VLS_ctx.error = null;
                [error,];
            } });
    const { default: __VLS_22 } = __VLS_18.slots;
    (__VLS_ctx.error);
    [error,];
    var __VLS_18;
    var __VLS_13;
}
if (!__VLS_ctx.isLoading) {
    [isLoading,];
    const __VLS_23 = {}.VRow;
    ;
    VRow;
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        noGutters: true,
    }));
    const __VLS_25 = __VLS_24({
        noGutters: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    const { default: __VLS_27 } = __VLS_26.slots;
    for (const [items, key] of __VLS_getVForSourceType((__VLS_ctx.boxes))) {
        [boxes,];
        const __VLS_28 = {}.VCol;
        ;
        VCol;
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            key: (key),
            ...{ class: ({ 'opacity-50': __VLS_ctx.isSaving }) },
        }));
        const __VLS_30 = __VLS_29({
            key: (key),
            ...{ class: ({ 'opacity-50': __VLS_ctx.isSaving }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        const { default: __VLS_32 } = __VLS_31.slots;
        [isSaving,];
        for (const [item] of __VLS_getVForSourceType((items))) {
            const __VLS_33 = {}.VCheckbox;
            ;
            VCheckbox;
            const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
                ...{ 'onChange': {} },
                key: (item),
                modelValue: (__VLS_ctx.checked),
                disabled: (__VLS_ctx.isSaving),
                label: (__VLS_ctx.getLabel(item)),
                value: (item),
                hideDetails: true,
            }));
            const __VLS_35 = __VLS_34({
                ...{ 'onChange': {} },
                key: (item),
                modelValue: (__VLS_ctx.checked),
                disabled: (__VLS_ctx.isSaving),
                label: (__VLS_ctx.getLabel(item)),
                value: (item),
                hideDetails: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_34));
            let __VLS_37;
            let __VLS_38;
            const __VLS_39 = ({ change: {} },
                { onChange: (__VLS_ctx.setChecked) });
            [isSaving, checked, getLabel, setChecked,];
            var __VLS_36;
        }
        var __VLS_31;
    }
    var __VLS_26;
    if (__VLS_ctx.isSaving) {
        [isSaving,];
        const __VLS_41 = {}.VCol;
        ;
        VCol;
        const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
            ...{ class: "text-center" },
            cols: "12",
        }));
        const __VLS_43 = __VLS_42({
            ...{ class: "text-center" },
            cols: "12",
        }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        const { default: __VLS_45 } = __VLS_44.slots;
        const __VLS_46 = {}.VChip;
        ;
        VChip;
        const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
            color: "primary",
            size: "small",
        }));
        const __VLS_48 = __VLS_47({
            color: "primary",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        const { default: __VLS_50 } = __VLS_49.slots;
        const __VLS_51 = {}.VProgressCircular;
        ;
        VProgressCircular;
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
            ...{ class: "mr-2" },
            indeterminate: true,
            size: "16",
            width: "2",
        }));
        const __VLS_53 = __VLS_52({
            ...{ class: "mr-2" },
            indeterminate: true,
            size: "16",
            width: "2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        (__VLS_ctx.t("components.checkboxGrid.saving"));
        [t,];
        var __VLS_49;
        var __VLS_44;
    }
}
;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            t: t,
            checked: checked,
            isLoading: isLoading,
            isSaving: isSaving,
            error: error,
            boxes: boxes,
            getLabel: getLabel,
            setChecked: setChecked,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
    },
    __typeProps: {},
});
;
