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
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.isLoading) {
    let __VLS_0;
    vCol;
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "text-center" },
        cols: "12",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "text-center" },
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    ;
    const { default: __VLS_5 } = __VLS_3.slots;
    let __VLS_6;
    vProgressCircular;
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        color: "primary",
        indeterminate: true,
    }));
    const __VLS_8 = __VLS_7({
        color: "primary",
        indeterminate: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-3" },
    });
    ;
    (__VLS_ctx.t("components.checkboxGrid.loading"));
    [isLoading, t,];
    var __VLS_3;
}
if (__VLS_ctx.error && !__VLS_ctx.isLoading) {
    let __VLS_11;
    vCol;
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        cols: "12",
    }));
    const __VLS_13 = __VLS_12({
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const { default: __VLS_16 } = __VLS_14.slots;
    let __VLS_17;
    vAlert;
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        ...{ 'onClick:close': {} },
        dismissible: true,
        type: "error",
    }));
    const __VLS_19 = __VLS_18({
        ...{ 'onClick:close': {} },
        dismissible: true,
        type: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    let __VLS_22;
    const __VLS_23 = ({ 'click:close': {} },
        { 'onClick:close': (...[$event]) => {
                if (!(__VLS_ctx.error && !__VLS_ctx.isLoading))
                    return;
                __VLS_ctx.error = null;
                [isLoading, error, error,];
            } });
    const { default: __VLS_24 } = __VLS_20.slots;
    (__VLS_ctx.error);
    [error,];
    var __VLS_20;
    var __VLS_21;
    [];
    var __VLS_14;
}
if (!__VLS_ctx.isLoading) {
    let __VLS_25;
    vRow;
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        noGutters: true,
    }));
    const __VLS_27 = __VLS_26({
        noGutters: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const { default: __VLS_30 } = __VLS_28.slots;
    for (const [items, key] of __VLS_vFor((__VLS_ctx.boxes))) {
        let __VLS_31;
        vCol;
        const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            key: (key),
            ...{ class: ({ 'opacity-50': __VLS_ctx.isSaving }) },
        }));
        const __VLS_33 = __VLS_32({
            key: (key),
            ...{ class: ({ 'opacity-50': __VLS_ctx.isSaving }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        ;
        const { default: __VLS_36 } = __VLS_34.slots;
        for (const [item] of __VLS_vFor((items))) {
            let __VLS_37;
            vCheckbox;
            const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
                ...{ 'onChange': {} },
                key: (item),
                modelValue: (__VLS_ctx.checked),
                disabled: (__VLS_ctx.isSaving),
                label: (__VLS_ctx.getLabel(item)),
                value: (item),
                hideDetails: true,
            }));
            const __VLS_39 = __VLS_38({
                ...{ 'onChange': {} },
                key: (item),
                modelValue: (__VLS_ctx.checked),
                disabled: (__VLS_ctx.isSaving),
                label: (__VLS_ctx.getLabel(item)),
                value: (item),
                hideDetails: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_38));
            let __VLS_42;
            const __VLS_43 = ({ change: {} },
                { onChange: (__VLS_ctx.setChecked) });
            var __VLS_40;
            var __VLS_41;
            [isLoading, boxes, isSaving, isSaving, checked, getLabel, setChecked,];
        }
        [];
        var __VLS_34;
        [];
    }
    [];
    var __VLS_28;
    if (__VLS_ctx.isSaving) {
        let __VLS_44;
        vCol;
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            ...{ class: "text-center" },
            cols: "12",
        }));
        const __VLS_46 = __VLS_45({
            ...{ class: "text-center" },
            cols: "12",
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        ;
        const { default: __VLS_49 } = __VLS_47.slots;
        let __VLS_50;
        vChip;
        const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            color: "primary",
            size: "small",
        }));
        const __VLS_52 = __VLS_51({
            color: "primary",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        const { default: __VLS_55 } = __VLS_53.slots;
        let __VLS_56;
        vProgressCircular;
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            ...{ class: "mr-2" },
            indeterminate: true,
            size: "16",
            width: "2",
        }));
        const __VLS_58 = __VLS_57({
            ...{ class: "mr-2" },
            indeterminate: true,
            size: "16",
            width: "2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        ;
        (__VLS_ctx.t("components.checkboxGrid.saving"));
        [t, isSaving,];
        var __VLS_53;
        [];
        var __VLS_47;
    }
}
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
