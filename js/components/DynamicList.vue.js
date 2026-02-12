import { computed, onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { fetchService } from "@/services/fetch";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
import { COMPONENTS } from "@/configs/components";
const props = defineProps();
const { t } = useI18n();
const { getStorage, setStorage } = useStorage();
const { handleUserError } = useAlert();
const runtime = useRuntimeStore();
const { infoExchanges } = storeToRefs(runtime);
const settings = useSettingsStore();
const { exchanges, markets } = storeToRefs(settings);
const newItem = ref("");
const list = ref([]);
const isLoading = ref(false);
const isAdding = ref(false);
const error = ref(null);
const labelMap = {
    [COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES]: t("views.optionsIndex.exchanges.label"),
    [COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS]: t("views.optionsIndex.markets.label")
};
const titleMap = {
    [COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES]: t("views.optionsIndex.exchanges.title"),
    [COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS]: t("views.optionsIndex.markets.title")
};
const label = computed(() => labelMap[props.type] || "Error");
const title = computed(() => titleMap[props.type] || "Error");
const addItem = async (item) => {
    DomainUtils.log("DYNAMIC_LIST: addItem");
    if (!item.trim())
        return;
    isAdding.value = true;
    error.value = null;
    try {
        if (!list.value?.includes(item)) {
            switch (props.type) {
                case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                    list.value.push(item);
                    markets.value.push(item);
                    await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value]);
                    break;
                case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                    list.value.push(item.toUpperCase());
                    exchanges.value.push(item.toUpperCase());
                    await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value]);
                    const exchangesInfoData = await fetchService.fetchExchangesData([newItem.value]);
                    infoExchanges.value.set(exchanges.value[exchanges.value.length - 1], exchangesInfoData[0].value);
                    break;
                default:
            }
            newItem.value = "";
        }
    }
    catch (err) {
        await handleUserError("Components DynamicList", err, {});
    }
    finally {
        isAdding.value = false;
    }
};
const removeItem = async (n) => {
    DomainUtils.log("DYNAMIC_LIST: removeItem");
    if (n < 0)
        return;
    error.value = null;
    try {
        list.value.splice(n, 1);
        newItem.value = "";
        switch (props.type) {
            case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value]);
                break;
            case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value]);
                break;
            default:
        }
    }
    catch (err) {
        await handleUserError("Components DynamicList", err, {});
    }
};
onBeforeMount(async () => {
    DomainUtils.log("DYNAMIC_LIST: onBeforeMount");
    isLoading.value = true;
    error.value = null;
    try {
        const storage = await getStorage([
            BROWSER_STORAGE.MARKETS.key,
            BROWSER_STORAGE.EXCHANGES.key
        ]);
        switch (props.type) {
            case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
                list.value = storage[BROWSER_STORAGE.EXCHANGES.key];
                break;
            case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
                list.value = storage[BROWSER_STORAGE.MARKETS.key];
                break;
        }
    }
    catch (err) {
        await handleUserError("Components DynamicList", err, {});
    }
    finally {
        isLoading.value = false;
    }
});
DomainUtils.log("Components DynamicList: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vCard;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    title: (__VLS_ctx.title),
    color: "secondary",
}));
const __VLS_2 = __VLS_1({
    title: (__VLS_ctx.title),
    color: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
if (__VLS_ctx.isLoading) {
    let __VLS_7;
    vCardText;
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ class: "text-center" },
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "text-center" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    ;
    const { default: __VLS_12 } = __VLS_10.slots;
    let __VLS_13;
    vProgressCircular;
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        color: "primary",
        indeterminate: true,
    }));
    const __VLS_15 = __VLS_14({
        color: "primary",
        indeterminate: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-3" },
    });
    ;
    [title, isLoading,];
    var __VLS_10;
}
if (!__VLS_ctx.isLoading) {
    let __VLS_18;
    vList;
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        bgColor: "secondary",
    }));
    const __VLS_20 = __VLS_19({
        bgColor: "secondary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    const { default: __VLS_23 } = __VLS_21.slots;
    for (const [item, i] of __VLS_vFor((__VLS_ctx.list))) {
        let __VLS_24;
        vListItem;
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            key: (item),
            title: (item),
            hideDetails: true,
        }));
        const __VLS_26 = __VLS_25({
            key: (item),
            title: (item),
            hideDetails: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        const { default: __VLS_29 } = __VLS_27.slots;
        {
            const { prepend: __VLS_30 } = __VLS_27.slots;
            let __VLS_31;
            vBtn;
            const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
                ...{ 'onClick': {} },
                disabled: (__VLS_ctx.isAdding),
                ...{ class: "mr-3" },
                icon: "$close",
            }));
            const __VLS_33 = __VLS_32({
                ...{ 'onClick': {} },
                disabled: (__VLS_ctx.isAdding),
                ...{ class: "mr-3" },
                icon: "$close",
            }, ...__VLS_functionalComponentArgsRest(__VLS_32));
            let __VLS_36;
            const __VLS_37 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isLoading))
                            return;
                        __VLS_ctx.removeItem(i);
                        [isLoading, list, isAdding, removeItem,];
                    } });
            ;
            var __VLS_34;
            var __VLS_35;
            [];
        }
        [];
        var __VLS_27;
        [];
    }
    if (__VLS_ctx.list.length === 0) {
        let __VLS_38;
        vListItem;
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
        const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
        const { default: __VLS_43 } = __VLS_41.slots;
        let __VLS_44;
        vListItemTitle;
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            ...{ class: "text-center text-grey" },
        }));
        const __VLS_46 = __VLS_45({
            ...{ class: "text-center text-grey" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        ;
        ;
        const { default: __VLS_49 } = __VLS_47.slots;
        [list,];
        var __VLS_47;
        [];
        var __VLS_41;
    }
    [];
    var __VLS_21;
    let __VLS_50;
    vCardActions;
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
    const __VLS_52 = __VLS_51({}, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_55 } = __VLS_53.slots;
    let __VLS_56;
    vTextField;
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        modelValue: (__VLS_ctx.newItem),
        autofocus: (true),
        clearable: (true),
        disabled: (__VLS_ctx.isAdding),
        label: (__VLS_ctx.label),
        placeholder: (props.placeholder),
        type: "text",
    }));
    const __VLS_58 = __VLS_57({
        modelValue: (__VLS_ctx.newItem),
        autofocus: (true),
        clearable: (true),
        disabled: (__VLS_ctx.isAdding),
        label: (__VLS_ctx.label),
        placeholder: (props.placeholder),
        type: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    const { default: __VLS_61 } = __VLS_59.slots;
    {
        const { append: __VLS_62 } = __VLS_59.slots;
        let __VLS_63;
        vBtn;
        const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
            ...{ 'onClick': {} },
            disabled: (!__VLS_ctx.newItem.trim() || __VLS_ctx.isAdding),
            loading: (__VLS_ctx.isAdding),
            ...{ class: "ml-3" },
            color: "primary",
            icon: "$add",
        }));
        const __VLS_65 = __VLS_64({
            ...{ 'onClick': {} },
            disabled: (!__VLS_ctx.newItem.trim() || __VLS_ctx.isAdding),
            loading: (__VLS_ctx.isAdding),
            ...{ class: "ml-3" },
            color: "primary",
            icon: "$add",
        }, ...__VLS_functionalComponentArgsRest(__VLS_64));
        let __VLS_68;
        const __VLS_69 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.isLoading))
                        return;
                    __VLS_ctx.addItem(__VLS_ctx.newItem);
                    [isAdding, isAdding, isAdding, newItem, newItem, newItem, label, addItem,];
                } });
        ;
        var __VLS_66;
        var __VLS_67;
        [];
    }
    [];
    var __VLS_59;
    [];
    var __VLS_53;
}
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
