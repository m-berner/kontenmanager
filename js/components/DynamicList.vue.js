import { computed, onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { fetchService } from "@/services/fetch";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { COMPONENTS } from "@/config/components";
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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VCard;
;
VCard;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: (__VLS_ctx.title),
    color: "secondary",
}));
const __VLS_2 = __VLS_1({
    title: (__VLS_ctx.title),
    color: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
[title,];
if (__VLS_ctx.isLoading) {
    [isLoading,];
    const __VLS_6 = {}.VCardText;
    ;
    VCardText;
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        ...{ class: "text-center" },
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "text-center" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_10 } = __VLS_9.slots;
    const __VLS_11 = {}.VProgressCircular;
    ;
    VProgressCircular;
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        color: "primary",
        indeterminate: true,
    }));
    const __VLS_13 = __VLS_12({
        color: "primary",
        indeterminate: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "mt-3" },
    });
    var __VLS_9;
}
if (!__VLS_ctx.isLoading) {
    [isLoading,];
    const __VLS_16 = {}.VList;
    ;
    VList;
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        bgColor: "secondary",
    }));
    const __VLS_18 = __VLS_17({
        bgColor: "secondary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const { default: __VLS_20 } = __VLS_19.slots;
    for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.list))) {
        [list,];
        const __VLS_21 = {}.VListItem;
        ;
        VListItem;
        const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
            key: (item),
            title: (item),
            hideDetails: true,
        }));
        const __VLS_23 = __VLS_22({
            key: (item),
            title: (item),
            hideDetails: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
        const { default: __VLS_25 } = __VLS_24.slots;
        {
            const { prepend: __VLS_26 } = __VLS_24.slots;
            const __VLS_27 = {}.VBtn;
            ;
            VBtn;
            const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
                ...{ 'onClick': {} },
                disabled: (__VLS_ctx.isAdding),
                ...{ class: "mr-3" },
                icon: "$close",
            }));
            const __VLS_29 = __VLS_28({
                ...{ 'onClick': {} },
                disabled: (__VLS_ctx.isAdding),
                ...{ class: "mr-3" },
                icon: "$close",
            }, ...__VLS_functionalComponentArgsRest(__VLS_28));
            let __VLS_31;
            let __VLS_32;
            const __VLS_33 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isLoading))
                            return;
                        __VLS_ctx.removeItem(i);
                        [isAdding, removeItem,];
                    } });
            var __VLS_30;
        }
        var __VLS_24;
    }
    if (__VLS_ctx.list.length === 0) {
        [list,];
        const __VLS_35 = {}.VListItem;
        ;
        VListItem;
        const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({}));
        const __VLS_37 = __VLS_36({}, ...__VLS_functionalComponentArgsRest(__VLS_36));
        const { default: __VLS_39 } = __VLS_38.slots;
        const __VLS_40 = {}.VListItemTitle;
        ;
        VListItemTitle;
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            ...{ class: "text-center text-grey" },
        }));
        const __VLS_42 = __VLS_41({
            ...{ class: "text-center text-grey" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        const { default: __VLS_44 } = __VLS_43.slots;
        var __VLS_43;
        var __VLS_38;
    }
    var __VLS_19;
    const __VLS_45 = {}.VCardActions;
    ;
    VCardActions;
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({}));
    const __VLS_47 = __VLS_46({}, ...__VLS_functionalComponentArgsRest(__VLS_46));
    const { default: __VLS_49 } = __VLS_48.slots;
    const __VLS_50 = {}.VTextField;
    ;
    VTextField;
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        modelValue: (__VLS_ctx.newItem),
        autofocus: (true),
        clearable: (true),
        disabled: (__VLS_ctx.isAdding),
        label: (__VLS_ctx.label),
        placeholder: (props.placeholder),
        type: "text",
    }));
    const __VLS_52 = __VLS_51({
        modelValue: (__VLS_ctx.newItem),
        autofocus: (true),
        clearable: (true),
        disabled: (__VLS_ctx.isAdding),
        label: (__VLS_ctx.label),
        placeholder: (props.placeholder),
        type: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_54 } = __VLS_53.slots;
    [isAdding, newItem, label,];
    {
        const { append: __VLS_55 } = __VLS_53.slots;
        const __VLS_56 = {}.VBtn;
        ;
        VBtn;
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            ...{ 'onClick': {} },
            disabled: (!__VLS_ctx.newItem.trim() || __VLS_ctx.isAdding),
            loading: (__VLS_ctx.isAdding),
            ...{ class: "ml-3" },
            color: "primary",
            icon: "$add",
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
            disabled: (!__VLS_ctx.newItem.trim() || __VLS_ctx.isAdding),
            loading: (__VLS_ctx.isAdding),
            ...{ class: "ml-3" },
            color: "primary",
            icon: "$add",
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_60;
        let __VLS_61;
        const __VLS_62 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.isLoading))
                        return;
                    __VLS_ctx.addItem(__VLS_ctx.newItem);
                    [isAdding, isAdding, newItem, newItem, addItem,];
                } });
        var __VLS_59;
    }
    var __VLS_53;
    var __VLS_48;
}
var __VLS_3;
;
;
;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            newItem: newItem,
            list: list,
            isLoading: isLoading,
            isAdding: isAdding,
            label: label,
            title: title,
            addItem: addItem,
            removeItem: removeItem,
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
