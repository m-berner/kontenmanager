import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { STORES } from "@/config/stores";
const { n, t } = useI18n();
const runtime = useRuntimeStore();
const { curUsd, infoMaterials } = storeToRefs(runtime);
const settings = useSettingsStore();
const materialValues = computed(() => {
    const result = new Map();
    for (const item of settings.materials) {
        const code = STORES.MATERIALS.get(item) ?? "";
        const usdValue = infoMaterials.value.get(code) ?? 0;
        const localValue = usdValue / curUsd.value;
        result.set(item, { usd: usdValue, local: localValue });
    }
    return result;
});
DomainUtils.log("VIEWS InfoBar: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VAppBar;
;
VAppBar;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    app: true,
    color: "secondary",
    flat: true,
}));
const __VLS_2 = __VLS_1({
    app: true,
    color: "secondary",
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VList;
;
VList;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
    bgColor: "secondary",
    ...{ class: "horizontal-list" },
    lines: "two",
}));
const __VLS_8 = __VLS_7({
    bgColor: "secondary",
    ...{ class: "horizontal-list" },
    lines: "two",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.settings.exchanges))) {
    [settings,];
    const __VLS_11 = {}.VListItem;
    ;
    VListItem;
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        key: (item),
    }));
    const __VLS_13 = __VLS_12({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const { default: __VLS_15 } = __VLS_14.slots;
    const __VLS_16 = {}.VListItemTitle;
    ;
    VListItemTitle;
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
    const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const { default: __VLS_20 } = __VLS_19.slots;
    (item);
    var __VLS_19;
    const __VLS_21 = {}.VListItemSubtitle;
    ;
    VListItemSubtitle;
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
    const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    (__VLS_ctx.n(__VLS_ctx.runtime.infoExchanges.get(item) ?? 1, "decimal3"));
    [n, runtime,];
    var __VLS_24;
    var __VLS_14;
}
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.settings.indexes))) {
    [settings,];
    const __VLS_26 = {}.VListItem;
    ;
    VListItem;
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
        key: (item),
    }));
    const __VLS_28 = __VLS_27({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const { default: __VLS_30 } = __VLS_29.slots;
    const __VLS_31 = {}.VListItemTitle;
    ;
    VListItemTitle;
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({}));
    const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const { default: __VLS_35 } = __VLS_34.slots;
    (__VLS_ctx.STORES.INDEXES.get(item));
    [STORES,];
    var __VLS_34;
    const __VLS_36 = {}.VListItemSubtitle;
    ;
    VListItemSubtitle;
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const { default: __VLS_40 } = __VLS_39.slots;
    (__VLS_ctx.n(__VLS_ctx.runtime.infoIndexes.get(item) ?? 0, "integer"));
    [n, runtime,];
    var __VLS_39;
    var __VLS_29;
}
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.settings.materials))) {
    [settings,];
    const __VLS_41 = {}.VListItem;
    ;
    VListItem;
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        key: (item),
    }));
    const __VLS_43 = __VLS_42({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    const { default: __VLS_45 } = __VLS_44.slots;
    const __VLS_46 = {}.VListItemTitle;
    ;
    VListItemTitle;
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({}));
    const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
    const { default: __VLS_50 } = __VLS_49.slots;
    (__VLS_ctx.t("views.optionsIndex.materials." + item));
    [t,];
    var __VLS_49;
    const __VLS_51 = {}.VListItemSubtitle;
    ;
    VListItemSubtitle;
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
    const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
    const { default: __VLS_55 } = __VLS_54.slots;
    (__VLS_ctx.n(__VLS_ctx.materialValues.get(item)?.usd ?? 0, "currencyUSD") +
        " / " +
        __VLS_ctx.n(__VLS_ctx.materialValues.get(item)?.local ?? 0, "currency"));
    [n, n, materialValues, materialValues,];
    var __VLS_54;
    var __VLS_44;
}
var __VLS_9;
var __VLS_3;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            STORES: STORES,
            n: n,
            t: t,
            runtime: runtime,
            settings: settings,
            materialValues: materialValues,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
